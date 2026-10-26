import { createHmac, timingSafeEqual } from "node:crypto";
import { appUrl } from "@/lib/app-url";

export type PaymentAssessment = "success" | "failed" | "pending" | "mismatch";

export type VerifiedCharge = {
  status: string;
  amount: number;
  currency: string;
  reference: string;
};

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function paystackWebhookSecret() {
  return process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "";
}

export function verifyPaystackSignature(rawBody: string, signature: string | null, secret = paystackWebhookSecret()) {
  if (!secret || !signature) return false;
  const digest = createHmac("sha512", secret).update(rawBody).digest("hex");
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function assessCharge(charge: VerifiedCharge, expected: { amount: number; currency: string; reference: string }): PaymentAssessment {
  if (charge.reference !== expected.reference) return "mismatch";
  if (charge.currency.toUpperCase() !== expected.currency.toUpperCase()) return "mismatch";
  if (!Number.isInteger(charge.amount) || charge.amount !== expected.amount) return "mismatch";
  if (charge.status === "success") return "success";
  if (charge.status === "failed" || charge.status === "abandoned" || charge.status === "reversed") return "failed";
  return "pending";
}

export async function initializePaystackCheckout(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  registrationId: string;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || input.amount <= 0) return { configured: false as const, url: null };
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      reference: input.reference,
      callback_url: `${appUrl()}/register/success?reference=${encodeURIComponent(input.reference)}`,
      metadata: { registrationId: input.registrationId, reference: input.reference },
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    status?: boolean;
    data?: { authorization_url?: string; reference?: string };
  } | null;
  if (!response.ok || !payload?.status || !payload.data?.authorization_url) {
    return { configured: true as const, url: null };
  }
  return { configured: true as const, url: payload.data.authorization_url, providerReference: payload.data.reference ?? input.reference };
}

export async function verifyPaystackReference(reference: string): Promise<VerifiedCharge | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as {
    status?: boolean;
    data?: { status?: string; amount?: number; currency?: string; reference?: string };
  } | null;
  if (!response.ok || !payload?.status || !payload.data?.reference || payload.data.amount == null || !payload.data.currency || !payload.data.status) {
    return null;
  }
  return {
    status: payload.data.status,
    amount: payload.data.amount,
    currency: payload.data.currency,
    reference: payload.data.reference,
  };
}

export async function refundPaystack(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false as const, reason: "unconfigured" };
  const response = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: reference }),
  });
  const payload = (await response.json().catch(() => null)) as { status?: boolean; message?: string } | null;
  if (!response.ok || !payload?.status) return { ok: false as const, reason: payload?.message || "rejected" };
  return { ok: true as const };
}
