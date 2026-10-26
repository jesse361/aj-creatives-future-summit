import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { subscribeNewsletter } from "@/lib/audience";
import { createInquiry } from "@/lib/audience";
import { applyFailedPayment, applyVerifiedPayment } from "@/lib/payments";
import { assessCharge, verifyPaystackSignature } from "@/lib/paystack";
import { registerAttendee, RegistrationError } from "@/lib/registration";

async function reset() {
  await prisma.paymentWebhookEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.registrationItem.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.sessionSpeaker.deleteMany();
  await prisma.session.deleteMany();
  await prisma.eventSpeaker.deleteMany();
  await prisma.eventSponsor.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.event.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.rateLimit.deleteMany();
}

async function createEvent(options?: { capacity?: number; priceMinor?: number; status?: "PUBLISHED" | "DRAFT" | "CANCELLED" }) {
  return prisma.event.create({
    data: {
      title: "Test Assembly",
      slug: `test-${randomUUID()}`,
      shortDescription: "A test event description long enough.",
      fullDescription: "A longer test event description for validation.",
      category: "Business conference",
      startDate: new Date("2027-04-01T09:00:00.000Z"),
      endDate: new Date("2027-04-01T17:00:00.000Z"),
      timezone: "UTC",
      eventFormat: "ONLINE",
      status: options?.status ?? "PUBLISHED",
      registrationOpen: true,
      ticketTypes: {
        create: {
          name: "General",
          description: "Test ticket",
          priceMinor: options?.priceMinor ?? 0,
          currency: "GHS",
          capacity: options?.capacity ?? 2,
          benefits: [],
          status: "ACTIVE",
        },
      },
    },
    include: { ticketTypes: true },
  });
}

function input(eventId: string, ticketTypeId: string, overrides: Record<string, unknown> = {}) {
  return {
    eventId,
    ticketTypeId,
    quantity: 1,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "",
    organization: "",
    termsAccepted: true,
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

beforeEach(reset);
afterAll(async () => {
  await prisma.$disconnect();
});

describe("registration", () => {
  it("confirms a free ticket from the database price and reserves inventory", async () => {
    const event = await createEvent();
    const ticket = event.ticketTypes[0];
    const result = await registerAttendee(input(event.id, ticket.id));
    expect(result.registration.registrationStatus).toBe("CONFIRMED");
    expect(result.registration.totalAmount).toBe(0);
    const stored = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(stored?.sold).toBe(1);
  });

  it("stores the server price for a paid hold and does not confirm it", async () => {
    const event = await createEvent({ priceMinor: 25000 });
    const ticket = event.ticketTypes[0];
    const result = await registerAttendee(input(event.id, ticket.id, { email: "paid@example.com" }), { paymentConfigured: true });
    expect(result.registration.registrationStatus).toBe("PENDING_PAYMENT");
    expect(result.registration.totalAmount).toBe(25000);
    const item = await prisma.registrationItem.findFirst({ where: { registrationId: result.registration.id } });
    expect(item?.unitPrice).toBe(25000);
    const stored = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(stored?.sold).toBe(0);
    expect(stored?.reserved).toBe(1);
  });

  it("does not save a paid registration when checkout is unconfigured", async () => {
    const event = await createEvent({ priceMinor: 25000 });
    const ticket = event.ticketTypes[0];
    await expect(registerAttendee(input(event.id, ticket.id), { paymentConfigured: false })).rejects.toBeInstanceOf(RegistrationError);
    expect(await prisma.registration.count()).toBe(0);
  });

  it("refuses a second active registration for the same email and keeps one hold on retry", async () => {
    const event = await createEvent({ capacity: 2 });
    const ticket = event.ticketTypes[0];
    const key = randomUUID();
    await registerAttendee(input(event.id, ticket.id, { idempotencyKey: key }));
    const again = await registerAttendee(input(event.id, ticket.id, { idempotencyKey: key }));
    expect(again.created).toBe(false);
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } }))?.sold).toBe(1);
    await expect(registerAttendee(input(event.id, ticket.id, { idempotencyKey: randomUUID() }))).rejects.toMatchObject({ code: "DUPLICATE_EMAIL" });
  });

  it("does not oversell the last place", async () => {
    const event = await createEvent({ capacity: 1 });
    const ticket = event.ticketTypes[0];
    const results = await Promise.allSettled([
      registerAttendee(input(event.id, ticket.id, { email: "a@example.com" })),
      registerAttendee(input(event.id, ticket.id, { email: "b@example.com" })),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const stored = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect((stored?.sold ?? 0) + (stored?.reserved ?? 0)).toBe(1);
  });

  it("does not expose a draft event as a published registration target", async () => {
    const event = await createEvent({ status: "DRAFT" });
    const ticket = event.ticketTypes[0];
    await expect(registerAttendee(input(event.id, ticket.id))).rejects.toMatchObject({ code: "CLOSED" });
    const published = await prisma.event.count({ where: { status: "PUBLISHED" } });
    expect(published).toBe(0);
  });

  it("releases a failed payment and does not confirm the registration", async () => {
    const event = await createEvent({ priceMinor: 5000, capacity: 1 });
    const ticket = event.ticketTypes[0];
    const result = await registerAttendee(input(event.id, ticket.id, { email: "fail@example.com" }), { paymentConfigured: true });
    await applyFailedPayment(result.registration.reference, "declined");
    const stored = await prisma.registration.findUnique({ where: { id: result.registration.id } });
    const inventory = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(stored?.registrationStatus).toBe("FAILED");
    expect(inventory?.sold).toBe(0);
    expect(inventory?.reserved).toBe(0);
    const paid = await applyVerifiedPayment({ reference: result.registration.reference, amount: 5000, currency: "GHS", providerReference: result.registration.reference });
    expect(paid.ok).toBe(false);
  });

  it("confirms a verified payment once", async () => {
    const event = await createEvent({ priceMinor: 5000 });
    const ticket = event.ticketTypes[0];
    const result = await registerAttendee(input(event.id, ticket.id, { email: "ok@example.com" }), { paymentConfigured: true });
    const first = await applyVerifiedPayment({ reference: result.registration.reference, amount: 5000, currency: "GHS", providerReference: result.registration.reference });
    const second = await applyVerifiedPayment({ reference: result.registration.reference, amount: 5000, currency: "GHS", providerReference: result.registration.reference });
    expect(first.reason).toBe("paid");
    expect(second.reason).toBe("already-paid");
    const inventory = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(inventory?.sold).toBe(1);
    expect(inventory?.reserved).toBe(0);
    const mismatch = await applyVerifiedPayment({ reference: result.registration.reference, amount: 1, currency: "GHS", providerReference: "other" });
    expect(mismatch.reason === "already-paid" || mismatch.ok === true).toBe(true);
  });
});

describe("payments and audience", () => {
  it("rejects a bad webhook signature and a failed charge", () => {
    expect(verifyPaystackSignature("{}", "nope", "secret")).toBe(false);
    const body = "{}";
    const signature = createHmac("sha512", "secret").update(body).digest("hex");
    expect(verifyPaystackSignature(body, signature, "secret")).toBe(true);
    expect(assessCharge({ status: "failed", amount: 100, currency: "GHS", reference: "WHY-1" }, { amount: 100, currency: "GHS", reference: "WHY-1" })).toBe("failed");
    expect(assessCharge({ status: "success", amount: 50, currency: "GHS", reference: "WHY-1" }, { amount: 100, currency: "GHS", reference: "WHY-1" })).toBe("mismatch");
  });

  it("stores an inquiry and does not duplicate a newsletter subscription", async () => {
    const inquiry = await createInquiry({ name: "Ada Lovelace", email: "ada@example.com", category: "GENERAL", subject: "Hello there", message: "This is a long enough message." });
    expect(inquiry.id).toBeTruthy();
    const first = await subscribeNewsletter("ada@example.com");
    const second = await subscribeNewsletter("ada@example.com");
    expect(first.status).toBe("created");
    expect(second.status).toBe("exists");
    expect(await prisma.newsletterSubscriber.count()).toBe(1);
  });
});
