import Stripe from "stripe";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function createCheckout(input: {
  id: string;
  reference: string;
  email: string;
  quantity: number;
  amountCents: number;
  currency: string;
  ticketName: string;
  eventName: string;
}) {
  const stripe = stripeClient();
  if (!stripe || input.amountCents <= 0 || input.quantity < 1) return null;
  const unitAmount = Math.round(input.amountCents / input.quantity);
  if (unitAmount * input.quantity !== input.amountCents) return null;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    client_reference_id: input.id,
    metadata: { registrationId: input.id, reference: input.reference },
    line_items: [
      {
        quantity: input.quantity,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: { name: `${input.eventName} — ${input.ticketName}` },
        },
      },
    ],
    success_url: `${site}/registration/${input.reference}?payment=return`,
    cancel_url: `${site}/tickets?payment=cancelled`,
  });
  return session.url;
}

export function constructStripeEvent(body: string, signature: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) return null;
  const stripe = new Stripe(key);
  return stripe.webhooks.constructEvent(body, signature, secret);
}
