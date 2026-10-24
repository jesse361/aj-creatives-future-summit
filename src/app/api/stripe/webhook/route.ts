import { NextResponse } from "next/server";
import { markRegistrationPaid } from "@/lib/registrations";
import { paymentDecisionFromCheckout } from "@/lib/security";
import { constructStripeEvent } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const payload = await request.text();
  const verified = await constructStripeEvent(payload, signature);
  if (!verified.ok) return NextResponse.json({ error: verified.message }, { status: verified.status });

  if (verified.event.type === "checkout.session.completed") {
    const session = verified.event.data.object;
    const decision = paymentDecisionFromCheckout({
      payment_status: session.payment_status,
      metadata: session.metadata,
    });
    if (decision) await markRegistrationPaid(decision.registrationId);
  }

  return NextResponse.json({ received: true });
}
