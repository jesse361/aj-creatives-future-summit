import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { maskEmail } from "@/lib/reference";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Registration · AJ CREATIVES",
  robots: { index: false, follow: false },
};

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Loading registration…</p>}>
      <Confirmation params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirmation({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ reference }, query] = await Promise.all([params, searchParams]);
  const registration = await prisma.registration.findUnique({
    where: { reference },
    include: { ticketType: true, event: true },
  });
  if (!registration) notFound();

  const confirmed = registration.status === "CONFIRMED";
  const heading = registration.status === "CANCELLED" ? "Registration cancelled" : confirmed ? "Registration confirmed" : "Registration request saved";
  const detail =
    registration.status === "CANCELLED"
      ? "This registration is no longer active."
      : confirmed
        ? registration.paymentStatus === "PAID"
          ? "Payment has been verified. This ticket is confirmed."
          : "Your free registration has been saved and is confirmed."
        : "This is a registration request, not a confirmed ticket. A priced place stays pending until payment is verified.";

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-deep">{registration.event.name}</p>
      <h1 className="mt-3 font-display text-4xl text-navy">{heading}</h1>
      <p className="mt-4 leading-7 text-slate">{detail}</p>
      {query.payment === "return" && registration.status === "PENDING_PAYMENT" ? (
        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-6">If you completed payment, this page updates after the payment provider verifies it. Until then, the request is unpaid.</p>
      ) : null}
      <dl className="mt-8 grid gap-4 rounded-3xl bg-white p-6">
        <div>
          <dt className="text-sm text-slate">Reference</dt>
          <dd className="font-semibold text-navy">{registration.reference}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate">Name</dt>
          <dd>{registration.attendeeName}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate">Email</dt>
          <dd>{maskEmail(registration.email)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate">Ticket</dt>
          <dd>
            {registration.ticketType.name} × {registration.quantity}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate">Amount</dt>
          <dd>{registration.amountCents === 0 ? "No charge" : formatMoney(registration.amountCents, registration.currency)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate">Status</dt>
          <dd>
            {registration.status} · {registration.paymentStatus}
          </dd>
        </div>
      </dl>
    </article>
  );
}
