import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { assessCharge, paystackConfigured, verifyPaystackReference } from "@/lib/paystack";
import { applyFailedPayment, applyVerifiedPayment } from "@/lib/payments";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { maskEmail } from "@/lib/reference";

export const metadata: Metadata = { title: "Registration", robots: { index: false, follow: false } };
export const instant = false;

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  if (!reference) notFound();
  let registration = await prisma.registration.findUnique({
    where: { reference },
    include: { event: true, items: { include: { ticketType: true } }, payment: true },
  });
  if (!registration) notFound();

  if (registration.registrationStatus === "PENDING_PAYMENT" && registration.payment && paystackConfigured()) {
    const charge = await verifyPaystackReference(registration.reference);
    if (charge) {
      const assessment = assessCharge(charge, {
        amount: registration.totalAmount,
        currency: registration.currency,
        reference: registration.reference,
      });
      if (assessment === "success") {
        await applyVerifiedPayment({
          reference: registration.reference,
          amount: charge.amount,
          currency: charge.currency,
          providerReference: charge.reference,
        });
      } else if (assessment === "failed") {
        await applyFailedPayment(registration.reference, "The payment provider reported that the charge did not succeed.");
      }
      registration = await prisma.registration.findUnique({
        where: { reference },
        include: { event: true, items: { include: { ticketType: true } }, payment: true },
      });
    }
  }
  if (!registration) notFound();

  const confirmed = registration.registrationStatus === "CONFIRMED";
  const pending = registration.registrationStatus === "PENDING_PAYMENT";
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-electric">Registration {registration.reference}</p>
      <h1 className="mt-3 font-display text-5xl text-navy">{confirmed ? "You are confirmed." : pending ? "Payment is not confirmed." : "This registration is not active."}</h1>
      <p className="mt-4 text-ink-soft">
        {registration.event.title} · {maskEmail(registration.attendeeEmail)}
      </p>
      <ul className="mt-6 grid gap-2 text-sm">
        {registration.items.map((item) => (
          <li key={item.id}>{item.ticketType.name} × {item.quantity} · {formatMoney(item.subtotal, registration.currency)}</li>
        ))}
      </ul>
      {pending ? (
        <p className="mt-6 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          {paystackConfigured()
            ? "We have not verified a successful payment. A browser return is not proof of payment. The hold expires automatically if checkout is not completed."
            : "Paid checkout is not configured, so this registration cannot be confirmed. No card payment was taken."}
        </p>
      ) : null}
      {confirmed && registration.totalAmount === 0 ? <p className="mt-6 text-sm">No payment was required.</p> : null}
      {confirmed && registration.payment?.paymentStatus === "SUCCESS" ? <p className="mt-6 text-sm">Payment was verified with the provider.</p> : null}
      <p className="mt-8 text-sm"><Link className="underline" href={`/events/${registration.event.slug}`}>Back to the event</Link></p>
    </section>
  );
}
