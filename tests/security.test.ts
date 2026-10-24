import { describe, expect, it } from "vitest";
import { passwordsMatch } from "@/lib/password";
import { resetRateLimits, rateLimit } from "@/lib/rate-limit";
import { paymentDecisionFromCheckout, safeImageSrc, safeMapEmbed, toPublicRegistration } from "@/lib/security";
import { verifyAdminToken, signAdminToken } from "@/lib/session";
import { contactSchema, registrationSchema } from "@/lib/validation";

describe("validation", () => {
  it("requires the registration agreement and a real email", () => {
    const result = registrationSchema.safeParse({
      ticketTypeId: "ticket",
      quantity: 1,
      fullName: "A",
      email: "not-an-email",
      acceptTerms: false,
      idempotencyKey: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete registration payload", () => {
    const result = registrationSchema.safeParse({
      ticketTypeId: "ticket",
      quantity: "2",
      fullName: "Ama Mensah",
      email: "ama@example.com",
      phone: "+233 20 000 0000",
      acceptTerms: true,
      idempotencyKey: "idem-1234",
      companyWebsite: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a contact message that is too short", () => {
    expect(contactSchema.safeParse({ fullName: "Ada", email: "ada@example.com", category: "GENERAL", message: "Hi" }).success).toBe(false);
  });
});

describe("security helpers", () => {
  it("allows local images and https embeds, and drops other embeds", () => {
    expect(safeImageSrc("/images/hero.jpg")).toBe("/images/hero.jpg");
    expect(safeImageSrc("javascript:alert(1)")).toBeNull();
    expect(safeMapEmbed("https://www.google.com/maps/embed?pb=1")).toContain("google.com/maps/embed");
    expect(safeMapEmbed("https://example.com/maps/embed")).toBeNull();
  });

  it("confirms a ticket only after a paid checkout with a registration id", () => {
    expect(paymentDecisionFromCheckout({ payment_status: "unpaid", metadata: { registrationId: "reg" } })).toBeNull();
    expect(paymentDecisionFromCheckout({ payment_status: "paid", metadata: {} })).toBeNull();
    expect(paymentDecisionFromCheckout({ payment_status: "paid", metadata: { registrationId: "reg" } })?.paymentStatus).toBe("PAID");
  });

  it("keeps email and phone off the public registration view", () => {
    const view = toPublicRegistration({
      reference: "AJS-TESTREF123",
      attendeeName: "Ama Mensah",
      quantity: 1,
      status: "CONFIRMED",
      paymentStatus: "NOT_REQUIRED",
      emailStatus: "NOT_CONFIGURED",
      createdAt: new Date("2027-01-01T00:00:00.000Z"),
      ticketType: { name: "General Admission", currency: "USD", priceMinor: 0, isSample: true },
    });
    expect(view).not.toHaveProperty("email");
    expect(view).not.toHaveProperty("phone");
    expect(view.reference).toBe("AJS-TESTREF123");
  });

  it("rate limits repeated attempts", () => {
    resetRateLimits();
    expect(rateLimit("contact:test", 2, 60_000, 1_000).ok).toBe(true);
    expect(rateLimit("contact:test", 2, 60_000, 1_100).ok).toBe(true);
    expect(rateLimit("contact:test", 2, 60_000, 1_200).ok).toBe(false);
  });

  it("checks the administrator password and session token", async () => {
    expect(passwordsMatch("Summit-Demo-2027-Aj", process.env.ADMIN_PASSWORD ?? "")).toBe(true);
    expect(passwordsMatch("wrong-password", process.env.ADMIN_PASSWORD ?? "")).toBe(false);
    const token = await signAdminToken(process.env.AUTH_SECRET ?? "");
    expect(await verifyAdminToken(token, process.env.AUTH_SECRET ?? "")).toBe(true);
    expect(await verifyAdminToken(token, "a-different-secret-value")).toBe(false);
    expect(await verifyAdminToken("not-a-token", process.env.AUTH_SECRET ?? "")).toBe(false);
  });
});
