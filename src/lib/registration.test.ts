import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { cancelRegistrationRecord, registerAttendee, RegistrationError } from "@/lib/registration";

async function reset() {
  await prisma.registration.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.event.deleteMany();
}

async function createEvent(options?: { capacity?: number; priceCents?: number; phoneRequired?: boolean }) {
  return prisma.event.create({
    data: {
      name: "Test Summit",
      slug: `test-${randomUUID()}`,
      tagline: "Test",
      description: "Test event",
      status: "PUBLISHED",
      timezone: "UTC",
      settings: { create: { organizerName: "AJ CREATIVES", registrationOpen: true, phoneRequired: options?.phoneRequired ?? false } },
      venue: { create: {} },
      ticketTypes: {
        create: {
          name: options?.priceCents ? "Paid" : "Free",
          slug: "ticket",
          priceCents: options?.priceCents ?? 0,
          currency: "USD",
          capacity: options?.capacity ?? 2,
          benefits: "[]",
        },
      },
    },
    include: { ticketTypes: true },
  });
}

function input(ticketTypeId: string, overrides: Record<string, unknown> = {}) {
  return {
    ticketTypeId,
    quantity: 1,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "",
    organization: "",
    jobTitle: "",
    notes: "",
    termsAccepted: true,
    eligibilityAccepted: false,
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

beforeEach(reset);
afterAll(async () => {
  await prisma.$disconnect();
});

describe("registration persistence", () => {
  it("confirms a free ticket and reserves inventory", async () => {
    const event = await createEvent();
    const ticket = event.ticketTypes[0];
    if (!ticket) throw new Error("missing ticket");
    const result = await registerAttendee(input(ticket.id));
    expect(result.registration.status).toBe("CONFIRMED");
    expect(result.registration.paymentStatus).toBe("NOT_REQUIRED");
    const stored = await prisma.registration.findUnique({ where: { reference: result.registration.reference } });
    const updated = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(stored?.email).toBe("ada@example.com");
    expect(updated?.sold).toBe(1);
  });

  it("keeps a priced registration unpaid until payment is verified", async () => {
    const event = await createEvent({ priceCents: 15000 });
    const ticket = event.ticketTypes[0];
    if (!ticket) throw new Error("missing ticket");
    const result = await registerAttendee(input(ticket.id, { email: "paid@example.com" }));
    expect(result.registration.status).toBe("PENDING_PAYMENT");
    expect(result.registration.paymentStatus).toBe("UNPAID");
    expect(result.registration.amountCents).toBe(15000);
  });

  it("rejects a second registration for the same email and ignores a repeated submission", async () => {
    const event = await createEvent({ capacity: 5 });
    const ticket = event.ticketTypes[0];
    if (!ticket) throw new Error("missing ticket");
    const key = randomUUID();
    await registerAttendee(input(ticket.id, { idempotencyKey: key }));
    const repeat = await registerAttendee(input(ticket.id, { idempotencyKey: key, fullName: "Different" }));
    expect(repeat.created).toBe(false);
    await expect(registerAttendee(input(ticket.id, { idempotencyKey: randomUUID() }))).rejects.toBeInstanceOf(RegistrationError);
    const updated = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(updated?.sold).toBe(1);
  });

  it("stops an order that would exceed capacity", async () => {
    const event = await createEvent({ capacity: 1 });
    const ticket = event.ticketTypes[0];
    if (!ticket) throw new Error("missing ticket");
    await registerAttendee(input(ticket.id, { email: "one@example.com" }));
    await expect(registerAttendee(input(ticket.id, { email: "two@example.com" }))).rejects.toMatchObject({ code: "CAPACITY" });
  });

  it("releases capacity when a registration is cancelled", async () => {
    const event = await createEvent({ capacity: 1 });
    const ticket = event.ticketTypes[0];
    if (!ticket) throw new Error("missing ticket");
    const first = await registerAttendee(input(ticket.id, { email: "one@example.com" }));
    await cancelRegistrationRecord(first.registration.id);
    const second = await registerAttendee(input(ticket.id, { email: "one@example.com" }));
    expect(second.registration.status).toBe("CONFIRMED");
    const updated = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(updated?.sold).toBe(1);
  });

  it("requires agreement and a phone number when the event asks for one", async () => {
    const event = await createEvent({ phoneRequired: true });
    const ticket = event.ticketTypes[0];
    if (!ticket) throw new Error("missing ticket");
    await expect(registerAttendee(input(ticket.id, { termsAccepted: false }))).rejects.toMatchObject({ code: "TERMS" });
    await expect(registerAttendee(input(ticket.id, { email: "phone@example.com" }))).rejects.toMatchObject({ code: "PHONE" });
  });
});
