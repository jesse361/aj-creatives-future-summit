import Link from "next/link";
import type { Metadata } from "next";
import { DemoNote, PageHero } from "@/components/ui";
import { getTicketCatalogue } from "@/lib/queries";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Tickets", description: "Ticket types and prices published by WHY US." };

export default async function TicketsPage() {
  const detailed = (await getTicketCatalogue()).map((event) => ({ event, tickets: event.ticketTypes }));
  return (
    <>
      <PageHero eyebrow="Access" title="Tickets" description="Prices come from the published ticket catalogue. Demonstration prices are labeled and are not a confirmed offer." />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        {detailed.map(({ event, tickets }) => (
          <section key={event.id} className="border border-line bg-white p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl text-navy">{event.title}</h2>
              {event.isDemonstration ? <DemoNote /> : null}
            </div>
            <ul className="mt-6 grid gap-4 lg:grid-cols-3">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="border border-line p-4">
                  <h3 className="font-display text-2xl">{ticket.name}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{ticket.description}</p>
                  <p className="mt-4 text-lg">{ticket.priceMinor === 0 ? "Free" : formatMoney(ticket.priceMinor, ticket.currency)}</p>
                  <ul className="mt-3 grid gap-1 text-sm text-ink-soft">{ticket.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mist">{Math.max(ticket.capacity - ticket.sold - ticket.reserved, 0)} available</p>
                  <Link className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-electric" href={`/register?event=${event.slug}&ticket=${ticket.id}`}>Register</Link>
                </li>
              ))}
              {tickets.length === 0 ? <li className="text-sm text-ink-soft">No active tickets.</li> : null}
            </ul>
          </section>
        ))}
        {detailed.length === 0 ? <p className="text-ink-soft">Tickets appear when an upcoming event is published.</p> : null}
      </div>
    </>
  );
}
