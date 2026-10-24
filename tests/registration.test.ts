import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createInquiry } from "@/lib/contact";
import { createRegistration } from "@/lib/registrations";
import { resetRateLimits } from "@/lib/rate-limit";

async function resetDatabase() {
  await prisma.registration.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.sessionSpeaker.deleteMany();
  await prisma.session.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.event.deleteMany();
  await prisma.eventSettings.deleteMany();
}

async function seedTicket(priceMinor: number, capacity = 2) {
  const event = await prisma.event.create({
    data: {
      slug: "future-summit-2027",
      name: "THE FUTURE SUMMIT 2027",
      tagline: "Ideas That Shape Tomorrow.",
      description: "Test event",
      timezone: "UTC",
    },
  });
  await prisma.eventSettings.create({
    data: {
      id: "default",
      organizerName: "AJ Creatives",
      currency: "USD",
      registrationOpen: true,
      maxTicketsPerOrder: 4,
      requirePhone: true,
      privacyNotice: "Privacy",
      termsText: "Terms",
    },
  });
  return prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: priceMinor === 0 ? "Student Pass" : "General Admission",
      slug: "pass",
      description: "Test ticket",
      priceMinor,
      currency: "USD",
      capacity,
      active: true,
      isSample: true,
    },
  });
}

function payload(ticketTypeId: string, overrides: Record<string, unknown> = {}) {
  return {
    ticketTypeId,
    quantity: 1,
    fullName: "Ama Mensah",
    email: "ama@example.com",
    phone: "0200000000",
    organization: "",
    jobTitle: "",
    dietaryNotes: "",
    acceptTerms: true,
    idempotencyKey: crypto.randomUUID(),
    companyWebsite: "",
    ...overrides,
  };
}

describe("registration persistence", () => {
  beforeEach(async () => {
    resetRateLimits();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.RESEND_API_KEY;
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("saves a free registration as confirmed and blocks a second sale past capacity", async () => {
    const ticket = await seedTicket(0, 2);
    const first = await createRegistration(payload(ticket.id, { quantity: 2, idempotencyKey: "free-key-1" }), { ip: "free" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.status).toBe("CONFIRMED");
    expect(first.paymentStatus).toBe("NOT_REQUIRED");
    expect(first.registration).not.toHaveProperty("email");

    const stored = await prisma.registration.findUnique({ where: { reference: first.reference } });
    expect(stored?.email).toBe("ama@example.com");
    const updated = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(updated?.sold).toBe(2);

    const second = await createRegistration(payload(ticket.id, { idempotencyKey: "free-key-2", email: "other@example.com" }), { ip: "free-2" });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.errors.quantity).toMatch(/enough tickets/i);
  });

  it("keeps a paid registration unpaid until payment is verified", async () => {
    const ticket = await seedTicket(15000, 5);
    const result = await createRegistration(payload(ticket.id, { idempotencyKey: "paid-key-1" }), { ip: "paid" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe("REQUESTED");
    expect(result.paymentStatus).toBe("UNPAID");
    expect(result.checkoutUrl).toBeNull();
  });

  it("does not reserve a second ticket when the same submission is repeated", async () => {
    const ticket = await seedTicket(0, 5);
    const input = payload(ticket.id, { idempotencyKey: "same-key" });
    const first = await createRegistration(input, { ip: "dup-1" });
    const second = await createRegistration(input, { ip: "dup-2" });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.reference).toBe(first.reference);
    expect(second.duplicate).toBe(true);
    const updated = await prisma.ticketType.findUnique({ where: { id: ticket.id } });
    expect(updated?.sold).toBe(1);
  });

  it("rejects invalid, spam, and over-capacity quantities before saving", async () => {
    const ticket = await seedTicket(0, 5);
    const invalid = await createRegistration(payload(ticket.id, { fullName: "A", acceptTerms: false }), { ip: "bad" });
    expect(invalid.ok).toBe(false);
    const spam = await createRegistration(payload(ticket.id, { companyWebsite: "https://spam.example" }), { ip: "spam" });
    expect(spam.ok).toBe(false);
    const tooMany = await createRegistration(payload(ticket.id, { quantity: 5, idempotencyKey: "too-many" }), { ip: "qty" });
    expect(tooMany.ok).toBe(false);
    expect(await prisma.registration.count()).toBe(0);
  });
});

describe("contact inquiries", () => {
  beforeEach(async () => {
    resetRateLimits();
    await resetDatabase();
    await prisma.eventSettings.create({
      data: {
        id: "default",
        organizerName: "AJ Creatives",
        privacyNotice: "Privacy",
        termsText: "Terms",
      },
    });
  });

  it("saves a valid inquiry", async () => {
    const result = await createInquiry(
      {
        fullName: "Kwame Boateng",
        email: "kwame@example.com",
        category: "SPONSORSHIP",
        message: "We would like to ask about sponsorship options.",
        companyWebsite: "",
      },
      { ip: "contact-1" },
    );
    expect(result.ok).toBe(true);
    expect(await prisma.contactInquiry.count()).toBe(1);
  });
});
