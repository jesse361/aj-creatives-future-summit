import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PHONE_PATTERN, type RegistrationInput } from "@/lib/validation";
import { createReference } from "@/lib/reference";
import { releaseExpiredHolds } from "@/lib/payments";

export class RegistrationError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "CLOSED"
      | "UNAVAILABLE"
      | "SALES_WINDOW"
      | "CAPACITY"
      | "DUPLICATE_EMAIL"
      | "PHONE"
      | "TERMS"
      | "QUANTITY"
      | "VALIDATION"
      | "PAYMENT_UNCONFIGURED"
      | "CANCELLED",
    message: string,
  ) {
    super(message);
  }
}

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED"] as const;

function prismaCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
}

async function allocate(tx: Prisma.TransactionClient, ticketId: string, quantity: number, field: "sold" | "reserved") {
  const rows =
    field === "sold"
      ? await tx.$executeRaw`
          UPDATE "TicketType"
          SET "sold" = "sold" + ${quantity}
          WHERE "id" = ${ticketId}
            AND "status" = 'ACTIVE'
            AND ("capacity" - "sold" - "reserved") >= ${quantity}
        `
      : await tx.$executeRaw`
          UPDATE "TicketType"
          SET "reserved" = "reserved" + ${quantity}
          WHERE "id" = ${ticketId}
            AND "status" = 'ACTIVE'
            AND ("capacity" - "sold" - "reserved") >= ${quantity}
        `;
  return rows === 1;
}

export async function registerAttendee(input: RegistrationInput, options?: { paymentConfigured?: boolean }) {
  const email = input.email.toLowerCase();
  if (!input.termsAccepted) throw new RegistrationError("TERMS", "Agree to the terms to continue.");
  if (input.phone && !PHONE_PATTERN.test(input.phone)) {
    throw new RegistrationError("PHONE", "Enter a phone number using digits and standard symbols.");
  }

  await releaseExpiredHolds();

  return prisma.$transaction(async (tx) => {
    const existingByKey = await tx.registration.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { event: true, items: { include: { ticketType: true } } },
    });
    if (existingByKey) {
      return {
        registration: existingByKey,
        created: false,
        ticketName: existingByKey.items[0]?.ticketType.name ?? "Ticket",
        eventName: existingByKey.event.title,
      };
    }

    const event = await tx.event.findUnique({ where: { id: input.eventId } });
    if (!event || event.status !== "PUBLISHED") throw new RegistrationError("CLOSED", "Registration is not open for that event.");
    if (event.status === "PUBLISHED" && !event.registrationOpen) {
      throw new RegistrationError("CLOSED", "Registration is currently closed.");
    }

    const ticket = await tx.ticketType.findFirst({ where: { id: input.ticketTypeId, eventId: event.id } });
    if (!ticket || ticket.status !== "ACTIVE") throw new RegistrationError("UNAVAILABLE", "That ticket is not available.");
    if (input.quantity < ticket.minimumQuantity || input.quantity > ticket.maximumQuantity) {
      throw new RegistrationError("QUANTITY", `Choose between ${ticket.minimumQuantity} and ${ticket.maximumQuantity} tickets.`);
    }

    const now = new Date();
    if (ticket.salesStart && ticket.salesStart > now) throw new RegistrationError("SALES_WINDOW", "Sales for this ticket have not started.");
    if (ticket.salesEnd && ticket.salesEnd < now) throw new RegistrationError("SALES_WINDOW", "Sales for this ticket have ended.");
    if (ticket.priceMinor < 0 || ticket.priceMinor * input.quantity > 100_000_000) {
      throw new RegistrationError("VALIDATION", "That ticket cannot be reserved.");
    }

    const duplicate = await tx.registration.findFirst({
      where: { eventId: event.id, attendeeEmail: email, registrationStatus: { in: [...ACTIVE_STATUSES] } },
    });
    if (duplicate) throw new RegistrationError("DUPLICATE_EMAIL", "This email already has an active registration for the event.");

    const paymentRequired = ticket.priceMinor > 0;
    if (paymentRequired && options?.paymentConfigured === false) {
      throw new RegistrationError("PAYMENT_UNCONFIGURED", "Paid checkout is not configured. This registration was not saved.");
    }

    const reserved = await allocate(tx, ticket.id, input.quantity, paymentRequired ? "reserved" : "sold");
    if (!reserved) throw new RegistrationError("CAPACITY", "Not enough places remain for that quantity.");

    const settings = await tx.siteSettings.findUnique({ where: { id: "site" } });
    const holdMinutes = settings?.registrationHoldMinutes ?? 30;
    const unitPrice = ticket.priceMinor;
    const subtotal = unitPrice * input.quantity;
    const reference = createReference();

    try {
      const registration = await tx.registration.create({
        data: {
          reference,
          idempotencyKey: input.idempotencyKey,
          eventId: event.id,
          attendeeName: input.fullName.trim(),
          attendeeEmail: email,
          attendeePhone: input.phone.trim(),
          organization: input.organization.trim(),
          registrationStatus: paymentRequired ? "PENDING_PAYMENT" : "CONFIRMED",
          totalAmount: subtotal,
          currency: ticket.currency.toUpperCase(),
          termsAccepted: true,
          holdExpiresAt: paymentRequired ? new Date(now.getTime() + holdMinutes * 60 * 1000) : null,
          items: {
            create: {
              ticketTypeId: ticket.id,
              quantity: input.quantity,
              unitPrice,
              subtotal,
            },
          },
          ...(paymentRequired
            ? {
                payment: {
                  create: {
                    provider: "paystack",
                    providerReference: reference,
                    amount: subtotal,
                    currency: ticket.currency.toUpperCase(),
                    paymentStatus: "PENDING",
                  },
                },
              }
            : {}),
        },
      });
      return { registration, created: true, ticketName: ticket.name, eventName: event.title };
    } catch (error) {
      if (prismaCode(error) === "P2002") {
        const existing = await tx.registration.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) {
          return { registration: existing, created: false, ticketName: ticket.name, eventName: event.title };
        }
      }
      throw error;
    }
  });
}

export async function cancelRegistrationRecord(id: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({ where: { id }, include: { items: true, payment: true } });
    if (!registration) throw new RegistrationError("NOT_FOUND", "Registration not found.");
    if (registration.registrationStatus === "CANCELLED" || registration.registrationStatus === "EXPIRED" || registration.registrationStatus === "FAILED") {
      return registration;
    }
    const field = registration.registrationStatus === "CONFIRMED" ? "sold" : "reserved";
    for (const item of registration.items) {
      const ticket = await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: field === "sold" ? { sold: { decrement: item.quantity } } : { reserved: { decrement: item.quantity } },
      });
      if (ticket.sold < 0 || ticket.reserved < 0) throw new RegistrationError("CAPACITY", "Inventory could not be released.");
    }
    if (registration.payment && registration.payment.paymentStatus === "PENDING") {
      await tx.payment.update({ where: { id: registration.payment.id }, data: { paymentStatus: "CANCELLED" } });
    }
    return tx.registration.update({ where: { id }, data: { registrationStatus: "CANCELLED", holdExpiresAt: null } });
  });
}
