import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { PUBLIC_EVENT_TAG } from "@/lib/constants";
import { getCurrentAdmin } from "@/lib/auth";
import { constructStripeEvent } from "@/lib/payments";
import { markRegistrationPaid } from "@/lib/registration";
import { sendPaymentEmail } from "@/lib/email";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Payment webhook is not configured.", { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });

  let event;
  try {
    event = constructStripeEvent(await request.text(), signature);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }
  if (!event) return new Response("Payment webhook is not configured.", { status: 503 });

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status !== "paid") return new Response("ok");
    const registrationId = session.metadata?.registrationId || session.client_reference_id;
    if (!registrationId || session.amount_total == null || !session.currency) {
      return new Response("Incomplete payment payload.", { status: 400 });
    }
    const result = await markRegistrationPaid(registrationId, session.id, session.amount_total, session.currency);
    if (result.reason === "mismatch") return new Response("Amount does not match the registration.", { status: 400 });
    if (result.updated && result.registration) {
      const full = await prisma.registration.findUnique({ where: { id: registrationId }, include: { event: true } });
      if (full) {
        await sendPaymentEmail({
          reference: full.reference,
          email: full.email,
          attendeeName: full.attendeeName,
          quantity: full.quantity,
          status: "CONFIRMED",
          eventName: full.event.name,
        });
      }
      revalidateTag(PUBLIC_EVENT_TAG, { expire: 0 });
    }
  }

  return new Response("ok");
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  return Response.json({ configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) });
}
