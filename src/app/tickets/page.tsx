import type { Metadata } from "next";
import { TicketWizard } from "@/components/tickets/TicketWizard";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Choose a ticket category and register for The Future Summit 2027. Sample prices are not official rates.",
};

export default async function TicketsPage() {
  const data = await getSiteData();
  return (
    <main className="page-wrap py-16">
      <p className="text-xs tracking-[0.22em] text-action">REGISTRATION</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Tickets</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Select a category, add your details, and submit. Free tickets can be confirmed immediately. Paid tickets remain requests until payment is verified.
      </p>
      {data?.tickets.some((ticket) => ticket.isSample) ? (
        <p className="mt-4 rounded-2xl bg-lavender/25 px-4 py-3 text-sm text-navy">
          The prices below are sample demonstration data. They are not official ticket prices. Currency can be changed by the organizer. GHS is available once the event currency is confirmed.
        </p>
      ) : null}
      <div className="mt-8">
        <TicketWizard
          tickets={data?.tickets ?? []}
          registrationOpen={data?.settings.registrationOpen ?? false}
          maxTicketsPerOrder={data?.settings.maxTicketsPerOrder ?? 4}
          requirePhone={data?.settings.requirePhone ?? true}
          samplePrices={Boolean(data?.tickets.some((ticket) => ticket.isSample))}
          timezone={data?.event.timezone ?? "UTC"}
        />
      </div>
    </main>
  );
}
