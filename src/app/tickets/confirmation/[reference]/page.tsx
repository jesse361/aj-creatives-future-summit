import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { getPublicRegistration } from "@/lib/registrations";

type Props = { params: Promise<{ reference: string }> };

export const metadata: Metadata = {
  title: "Registration",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ params }: Props) {
  const { reference } = await params;
  const registration = await getPublicRegistration(reference);
  if (!registration) notFound();
  const confirmed = registration.status === "CONFIRMED" && registration.paymentStatus !== "UNPAID";
  return (
    <main className="page-wrap py-16">
      <p className="text-xs tracking-[0.22em] text-action">{confirmed ? "CONFIRMED" : "REQUEST RECEIVED"}</p>
      <h1 className="mt-3 text-5xl">{confirmed ? "Your registration is saved" : "Your request is saved"}</h1>
      {confirmed ? (
        <p className="mt-4 max-w-xl text-muted">
          This registration was stored successfully.
          {registration.paymentStatus === "PAID" ? " Payment was verified." : " No payment was required."}
        </p>
      ) : (
        <p className="mt-4 max-w-xl text-muted">
          This is a registration request, not a confirmed ticket. Payment has not been verified, so the place is held as a request only.
        </p>
      )}
      <dl className="surface-card mt-8 grid max-w-xl gap-3 p-6 text-sm">
        <div className="flex justify-between gap-4"><dt>Reference</dt><dd className="font-semibold">{registration.reference}</dd></div>
        <div className="flex justify-between gap-4"><dt>Name</dt><dd>{registration.attendeeName}</dd></div>
        <div className="flex justify-between gap-4"><dt>Ticket</dt><dd>{registration.ticketName}</dd></div>
        <div className="flex justify-between gap-4"><dt>Quantity</dt><dd>{registration.quantity}</dd></div>
        <div className="flex justify-between gap-4"><dt>Listed price</dt><dd>{formatMoney(registration.priceMinor, registration.currency)}{registration.isSamplePrice ? " (sample)" : ""}</dd></div>
        <div className="flex justify-between gap-4"><dt>Status</dt><dd>{registration.status}</dd></div>
        <div className="flex justify-between gap-4"><dt>Payment</dt><dd>{registration.paymentStatus}</dd></div>
      </dl>
      <p className="mt-4 max-w-xl text-sm text-muted">
        {registration.emailStatus === "SENT"
          ? "A confirmation email was sent."
          : "Email delivery is not configured, so keep this reference. The organizer can see the registration in the admin area."}
      </p>
      <Link href="/" className="btn btn-ghost mt-8">
        Back to the summit
      </Link>
    </main>
  );
}
