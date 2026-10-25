import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MAX_TICKETS_PER_ORDER } from "@/lib/constants";
import { PHONE_PATTERN, type RegistrationInput } from "@/lib/schemas";
import { createReference } from "@/lib/reference";

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
      | "ELIGIBILITY"
      | "QUANTITY"
      | "VALIDATION",
    message: string,
  ) {
    super(message);
  }
}

type RegistrationResult = {
  registration: {
    id: string;
    reference: string;
    email: string;
    attendeeName: string;
    quantity: number;
    status: string;
    paymentStatus: string;
    amountCents: number;
    currency: string;
  };
  created: boolean;
  ticketName: string;
  eventName: string;
};

function prismaCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
}

export async function registerAttendee(input: RegistrationInput): Promise<RegistrationResult> {
  const email = input.email.toLowerCase();
  if (!input.termsAccepted) throw new RegistrationError("TERMS", "Agree to the terms and privacy notice to continue.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_TICKETS_PER_ORDER) {
    throw new RegistrationError("QUANTITY", `Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`);
  }
  if (input.phone && !PHONE_PATTERN.test(input.phone)) {
    throw new RegistrationError("PHONE", "Enter a phone number using digits and standard symbols.");
  }

  return prisma.$transaction(async (tx) => {
    const existingByKey = await tx.registration.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existingByKey) {
      const ticket = await tx.ticketType.findUnique({ where: { id: existingByKey.ticketTypeId } });
      const event = await tx.event.findUnique({ where: { id: existingByKey.eventId } });
      return {
        registration: existingByKey,
        created: false,
        ticketName: ticket?.name ?? "Ticket",
        eventName: event?.name ?? "The Future Summit 2027",
      };
    }

    const event = await tx.event.findFirst({
      where: { status: "PUBLISHED" },
      include: { settings: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!event || !event.settings?.registrationOpen) {
      throw new RegistrationError("CLOSED", "Registration is currently closed.");
    }
    if (event.settings.phoneRequired && !input.phone.trim()) {
      throw new RegistrationError("PHONE", "A phone number is required for this event.");
    }

    const ticket = await tx.ticketType.findFirst({ where: { id: input.ticketTypeId, eventId: event.id } });
    if (!ticket || !ticket.active) throw new RegistrationError("UNAVAILABLE", "That ticket is not available.");

    const now = new Date();
    if (ticket.salesStart && ticket.salesStart > now) {
      throw new RegistrationError("SALES_WINDOW", "Sales for this ticket have not started.");
    }
    if (ticket.salesEnd && ticket.salesEnd < now) {
      throw new RegistrationError("SALES_WINDOW", "Sales for this ticket have ended.");
    }
    if (ticket.eligibilityNote && !input.eligibilityAccepted) {
      throw new RegistrationError("ELIGIBILITY", "Confirm the eligibility note before continuing.");
    }
    if (ticket.priceCents < 0 || ticket.priceCents * input.quantity > 100_000_000) {
      throw new RegistrationError("VALIDATION", "That ticket cannot be reserved.");
    }

    const existingEmail = await tx.registration.findUnique({
      where: { eventId_email: { eventId: event.id, email } },
    });
    if (existingEmail && existingEmail.status !== "CANCELLED") {
      throw new RegistrationError("DUPLICATE_EMAIL", "This email address already has a registration for the summit.");
    }

    const reserved = await tx.ticketType.updateMany({
      where: {
        id: ticket.id,
        active: true,
        sold: { lte: ticket.capacity - input.quantity },
      },
      data: { sold: { increment: input.quantity } },
    });
    if (reserved.count !== 1) {
      throw new RegistrationError("CAPACITY", "Not enough places remain for that quantity.");
    }

    const paymentRequired = ticket.priceCents > 0;
    const data = {
      reference: createReference(),
      idempotencyKey: input.idempotencyKey,
      eventId: event.id,
      ticketTypeId: ticket.id,
      attendeeName: input.fullName.trim(),
      email,
      phone: input.phone.trim(),
      organization: input.organization.trim(),
      jobTitle: input.jobTitle.trim(),
      quantity: input.quantity,
      dietaryNotes: input.notes.trim(),
      termsAccepted: true,
      status: paymentRequired ? "PENDING_PAYMENT" : "CONFIRMED",
      paymentStatus: paymentRequired ? "UNPAID" : "NOT_REQUIRED",
      amountCents: ticket.priceCents * input.quantity,
      currency: ticket.currency,
      emailStatus: "SKIPPED",
      paymentReference: "",
    };

    const finish = (registration: RegistrationResult["registration"], created: boolean): RegistrationResult => ({
      registration,
      created,
      ticketName: ticket.name,
      eventName: event.name,
    });

    if (existingEmail?.status === "CANCELLED") {
      const registration = await tx.registration.update({ where: { id: existingEmail.id }, data });
      return finish(registration, true);
    }

    try {
      const registration = await tx.registration.create({ data });
      return finish(registration, true);
    } catch (error) {
      if (prismaCode(error) !== "P2002") throw error;
      const details = JSON.stringify(error);
      if (details.includes("reference")) {
        const registration = await tx.registration.create({ data: { ...data, reference: createReference() } });
        return finish(registration, true);
      }
      if (details.includes("idempotencyKey")) {
        const existing = await tx.registration.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) return finish(existing, false);
      }
      throw new RegistrationError("DUPLICATE_EMAIL", "This email address already has a registration for the summit.");
    }
  });
}

export async function cancelRegistrationRecord(id: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({ where: { id } });
    if (!registration) throw new RegistrationError("NOT_FOUND", "Registration not found.");
    if (registration.status === "CANCELLED") return registration;
    const ticket = await tx.ticketType.update({
      where: { id: registration.ticketTypeId },
      data: { sold: { decrement: registration.quantity } },
    });
    if (ticket.sold < 0) throw new RegistrationError("CAPACITY", "Inventory could not be released.");
    return tx.registration.update({ where: { id }, data: { status: "CANCELLED" } });
  });
}

export async function markRegistrationPaid(registrationId: string, paymentReference: string, amountCents: number, currency: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({ where: { id: registrationId } });
    if (!registration || registration.status === "CANCELLED") return { updated: false, reason: "missing" as const };
    if (registration.paymentStatus === "PAID") return { updated: false, reason: "already-paid" as const, registration };
    if (registration.amountCents !== amountCents || registration.currency.toLowerCase() !== currency.toLowerCase()) {
      return { updated: false, reason: "mismatch" as const };
    }
    const result = await tx.registration.updateMany({
      where: { id: registrationId, paymentStatus: "UNPAID", status: "PENDING_PAYMENT" },
      data: { paymentStatus: "PAID", status: "CONFIRMED", paymentReference },
    });
    return { updated: result.count === 1, reason: "ok" as const, registration };
  });
}

export function registrationWhere(eventId: string, query: string, status: string): Prisma.RegistrationWhereInput {
  const allowed = new Set(["CONFIRMED", "PENDING_PAYMENT", "CANCELLED"]);
  const q = query.trim();
  return {
    eventId,
    ...(allowed.has(status) ? { status } : {}),
    ...(q
      ? {
          OR: [
            { attendeeName: { contains: q } },
            { email: { contains: q } },
            { reference: { contains: q } },
          ],
        }
      : {}),
  };
}
