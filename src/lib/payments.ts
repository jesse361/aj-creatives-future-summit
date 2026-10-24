import type { Registration, TicketType } from "@prisma/client";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export async function createTicketCheckout(registration: Registration, ticket: TicketType) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: registration.email,
    client_reference_id: registration.id,
    metadata: { registrationId: registration.id, reference: registration.reference },
    line_items: [
      {
        quantity: registration.quantity,
        price_data: {
          currency: ticket.currency.toLowerCase(),
          unit_amount: ticket.priceMinor,
          product_data: {
            name: ticket.name,
            description: ticket.isSample
              ? "Demonstration price. This is a registration request until payment is verified."
              : ticket.description.slice(0, 240),
          },
        },
      },
    ],
    success_url: `${site}/tickets/confirmation/${registration.reference}`,
    cancel_url: `${site}/tickets?payment=cancelled`,
  });
  return session.url;
}

export async function constructStripeEvent(payload: string, signature: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) return { ok: false as const, status: 501, message: "Payments are not configured." };
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return { ok: true as const, event };
  } catch {
    return { ok: false as const, status: 400, message: "Invalid payment signature." };
  }
}
