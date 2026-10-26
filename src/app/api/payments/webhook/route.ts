import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/constants";
import { sendRegistrationEmail } from "@/lib/email";
import { applyFailedPayment, applyVerifiedPayment } from "@/lib/payments";
import { assessCharge, paystackConfigured, verifyPaystackReference, verifyPaystackSignature } from "@/lib/paystack";

export async function POST(request: Request) {
  if (!paystackConfigured()) return new Response("Payment webhook is not configured.", { status: 503 });
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) return new Response("Invalid signature.", { status: 400 });

  let body: { event?: string; data?: { id?: number; reference?: string } };
  try {
    body = JSON.parse(raw) as { event?: string; data?: { id?: number; reference?: string } };
  } catch {
    return new Response("Invalid payload.", { status: 400 });
  }
  const reference = body.data?.reference;
  const eventKey = `${body.event ?? "unknown"}:${body.data?.id ?? ""}:${reference ?? ""}`;
  const existing = await prisma.paymentWebhookEvent.findUnique({ where: { provider_eventKey: { provider: "paystack", eventKey } } });
  if (existing?.status === "processed") return new Response("ok");
  await prisma.paymentWebhookEvent.upsert({
    where: { provider_eventKey: { provider: "paystack", eventKey } },
    update: {},
    create: { provider: "paystack", eventKey, status: "processing" },
  });

  if ((body.event === "charge.success" || body.event === "charge.failed") && reference) {
    const registration = await prisma.registration.findUnique({ where: { reference }, include: { event: true } });
    if (!registration) {
      await prisma.paymentWebhookEvent.update({ where: { provider_eventKey: { provider: "paystack", eventKey } }, data: { status: "processed" } });
      return new Response("ok");
    }
    const charge = await verifyPaystackReference(reference);
    if (!charge) return new Response("Verification failed.", { status: 400 });
    const assessment = assessCharge(charge, { amount: registration.totalAmount, currency: registration.currency, reference });
    if (assessment === "mismatch") return new Response("Amount does not match the registration.", { status: 400 });
    if (assessment === "success" && body.event === "charge.success") {
      const result = await applyVerifiedPayment({ reference, amount: charge.amount, currency: charge.currency, providerReference: charge.reference });
      if (result.ok && result.reason === "paid") {
        const emailStatus = await sendRegistrationEmail({
          reference,
          email: registration.attendeeEmail,
          attendeeName: registration.attendeeName,
          eventName: registration.event.title,
          status: "CONFIRMED",
        });
        await prisma.registration.update({ where: { id: registration.id }, data: { emailStatus } });
        revalidateTag(TAGS.events, { expire: 0 });
      }
    }
    if (assessment === "failed" || body.event === "charge.failed") {
      await applyFailedPayment(reference, "The provider did not verify a successful charge.");
    }
  }

  await prisma.paymentWebhookEvent.update({ where: { provider_eventKey: { provider: "paystack", eventKey } }, data: { status: "processed" } });
  return new Response("ok");
}
