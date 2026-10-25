import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { RegistrationWizard } from "@/components/registration-wizard";
import { getPublishedEvent } from "@/lib/event-data";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getPublishedEvent();
  const title = `Tickets · ${event?.name ?? "THE FUTURE SUMMIT 2027"} · AJ CREATIVES`;
  const description = "Select a ticket and register. Sample prices are not official. Paid registrations stay requests until payment is verified.";
  return { title, description, openGraph: { title, description } };
}

export default function TicketsPage({ searchParams }: { searchParams: Promise<{ ticket?: string; payment?: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Loading tickets…</p>}>
      <Tickets searchParams={searchParams} />
    </Suspense>
  );
}

async function Tickets({ searchParams }: { searchParams: Promise<{ ticket?: string; payment?: string }> }) {
  const [{ ticket, payment }, event] = await Promise.all([searchParams, getPublishedEvent()]);
  if (!event) notFound();
  const selected = event.tickets.find((item) => item.slug === ticket);
  return (
    <>
      <PageIntro
        eyebrow="Register"
        title="Tickets"
        description="Choose a ticket, add your details, and review them before submitting. Free tickets can be confirmed immediately. Priced tickets are saved as requests and are not confirmed until payment is verified."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {!event.settings.currencyConfirmed ? (
          <p className="mb-6 rounded-2xl bg-lavender/20 px-4 py-3 text-sm leading-6 text-navy">
            Demonstration prices. The currency is not confirmed. If the summit is held in Ghana, the organizer can switch it to GHS.
          </p>
        ) : null}
        <RegistrationWizard
          tickets={event.tickets}
          registrationOpen={event.settings.registrationOpen}
          phoneRequired={event.settings.phoneRequired}
          currencyConfirmed={event.settings.currencyConfirmed}
          initialTicketId={selected?.id}
          paymentCancelled={payment === "cancelled"}
        />
      </div>
    </>
  );
}
