import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createTicketCheckout, stripeConfigured } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { createReference, toPublicRegistration, zodFieldErrors } from "@/lib/security";
import { registrationSchema, type RegistrationInput } from "@/lib/validation";

export class RegistrationError extends Error {
  constructor(public code: "TICKET" | "WINDOW" | "CAPACITY" | "CLOSED" | "PHONE" | "LIMIT") {
    super(code);
  }
}

async function sendRegistrationNotice(registration: {
  id: string;
  reference: string;
  attendeeName: string;
  email: string;
  quantity: number;
  status: string;
  paymentStatus: string;
  ticketType: { name: string };
}) {
  const confirmed = registration.status === "CONFIRMED" && registration.paymentStatus !== "UNPAID";
  const subject = confirmed
    ? `Registration confirmed ${registration.reference}`
    : `Registration request ${registration.reference}`;
  const text = [
    `Hello ${registration.attendeeName},`,
    "",
    confirmed
      ? "Your registration has been saved and confirmed."
      : "Your registration request has been saved. This is not a confirmed ticket until payment is verified or the organizer confirms it.",
    "",
    `Reference: ${registration.reference}`,
    `Ticket: ${registration.ticketType.name}`,
    `Quantity: ${registration.quantity}`,
    `Status: ${registration.status}`,
    `Payment: ${registration.paymentStatus}`,
  ].join("\n");

  const emailStatus = await sendEmail({ to: registration.email, subject, text });
  await prisma.registration.update({
    where: { id: registration.id },
    data: { emailStatus },
  });
  return emailStatus;
}

export async function createRegistration(input: RegistrationInput, options: { ip: string }) {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, errors: zodFieldErrors(parsed.error.issues) };
  }
  const data = parsed.data;
  if (data.companyWebsite.trim()) {
    return { ok: false as const, errors: { form: "Unable to submit this registration." } };
  }

  const limited = rateLimit(`register:${options.ip}`, 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return {
      ok: false as const,
      errors: { form: "Too many registration attempts. Please wait a while and try again." },
    };
  }

  const settings = await prisma.eventSettings.findUnique({ where: { id: "default" } });
  if (!settings?.registrationOpen) {
    return { ok: false as const, errors: { form: "Registration is currently closed." } };
  }
  if (settings.requirePhone && !data.phone.trim()) {
    return { ok: false as const, errors: { phone: "Enter a phone number." } };
  }
  if (data.quantity > settings.maxTicketsPerOrder) {
    return {
      ok: false as const,
      errors: { quantity: `You can reserve up to ${settings.maxTicketsPerOrder} tickets in one registration.` },
    };
  }

  const existing = await prisma.registration.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    include: { ticketType: true },
  });
  if (existing) {
    return {
      ok: true as const,
      duplicate: true,
      reference: existing.reference,
      status: existing.status,
      paymentStatus: existing.paymentStatus,
      checkoutUrl: null as string | null,
      registration: toPublicRegistration(existing),
    };
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticketType.findUnique({ where: { id: data.ticketTypeId } });
      if (!ticket || !ticket.active) throw new RegistrationError("TICKET");
      const now = new Date();
      if ((ticket.salesStart && now < ticket.salesStart) || (ticket.salesEnd && now > ticket.salesEnd)) {
        throw new RegistrationError("WINDOW");
      }

      const updated = await tx.$executeRaw`
        UPDATE "TicketType"
        SET "sold" = "sold" + ${data.quantity}
        WHERE "id" = ${ticket.id}
          AND ("capacity" - "sold") >= ${data.quantity}
      `;
      if (updated !== 1) throw new RegistrationError("CAPACITY");

      const requiresPayment = ticket.priceMinor > 0;
      return tx.registration.create({
        data: {
          reference: createReference(),
          ticketTypeId: ticket.id,
          attendeeName: data.fullName,
          email: data.email.toLowerCase(),
          phone: data.phone.trim() || null,
          organization: data.organization.trim() || null,
          jobTitle: data.jobTitle.trim() || null,
          quantity: data.quantity,
          dietaryNotes: data.dietaryNotes.trim() || null,
          status: requiresPayment ? "REQUESTED" : "CONFIRMED",
          paymentStatus: requiresPayment ? "UNPAID" : "NOT_REQUIRED",
          emailStatus: "PENDING",
          idempotencyKey: data.idempotencyKey,
        },
        include: { ticketType: true },
      });
    });

    let checkoutUrl: string | null = null;
    if (created.paymentStatus === "UNPAID" && stripeConfigured()) {
      try {
        checkoutUrl = await createTicketCheckout(created, created.ticketType);
      } catch (error) {
        console.error("Stripe checkout was not created.", error);
      }
    }

    if (!checkoutUrl) {
      await sendRegistrationNotice(created);
    }

    const fresh = await prisma.registration.findUniqueOrThrow({
      where: { id: created.id },
      include: { ticketType: true },
    });

    return {
      ok: true as const,
      duplicate: false,
      reference: fresh.reference,
      status: fresh.status,
      paymentStatus: fresh.paymentStatus,
      checkoutUrl,
      registration: toPublicRegistration(fresh),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await prisma.registration.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { ticketType: true },
      });
      if (again) {
        return {
          ok: true as const,
          duplicate: true,
          reference: again.reference,
          status: again.status,
          paymentStatus: again.paymentStatus,
          checkoutUrl: null,
          registration: toPublicRegistration(again),
        };
      }
    }
    if (error instanceof RegistrationError) {
      if (error.code === "CAPACITY") {
        return { ok: false as const, errors: { quantity: "Not enough tickets remain for that quantity." } };
      }
      if (error.code === "WINDOW") {
        return { ok: false as const, errors: { form: "That ticket is not on sale right now." } };
      }
      return { ok: false as const, errors: { form: "Select an available ticket." } };
    }
    console.error(error);
    return { ok: false as const, errors: { form: "We could not save your registration. Please try again." } };
  }
}

export async function getPublicRegistration(reference: string) {
  const registration = await prisma.registration.findUnique({
    where: { reference },
    include: { ticketType: true },
  });
  if (!registration) return null;
  return toPublicRegistration(registration);
}

export async function markRegistrationPaid(registrationId: string) {
  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "CONFIRMED", paymentStatus: "PAID" },
    include: { ticketType: true },
  });
  await sendRegistrationNotice(registration);
  return registration;
}
