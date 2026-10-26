import Image from "next/image";
import Link from "next/link";
import { DemoNote } from "@/components/ui";
import { FORMAT_LABELS } from "@/lib/constants";
import { coverSrc, eventPlace } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { formatDayLabel } from "@/lib/time";

type CardEvent = {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  startDate: Date;
  timezone: string;
  eventFormat: string;
  venueName: string;
  city: string;
  coverImage: string;
  coverAlt: string;
  isDemonstration: boolean;
  registrationOpen: boolean;
  status: string;
  ticketTypes: { priceMinor: number; currency: string; status: string }[];
};

export function EventCard({ event }: { event: CardEvent }) {
  const ticket = event.ticketTypes[0];
  const price = !ticket ? "Pricing to be announced" : ticket.priceMinor === 0 ? "Free" : `From ${formatMoney(ticket.priceMinor, ticket.currency)}`;
  const canRegister = event.status === "PUBLISHED" && event.registrationOpen && ticket;
  return (
    <article className="flex h-full flex-col border border-line bg-white">
      <div className="relative aspect-[16/10]">
        <Image src={coverSrc(event.coverImage)} alt={event.coverAlt || "Illustrative event photograph. Not a confirmed WHY US photograph."} fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-electric">{event.category}</p>
          {event.isDemonstration ? <DemoNote /> : null}
        </div>
        <h3 className="font-display text-2xl text-navy">{event.title}</h3>
        <p className="text-sm text-ink-soft">{formatDayLabel(event.startDate.toISOString(), event.timezone)}</p>
        <p className="text-sm text-ink-soft">{eventPlace(event)} · {FORMAT_LABELS[event.eventFormat] ?? event.eventFormat}</p>
        <p className="text-sm leading-6 text-ink">{event.shortDescription}</p>
        <p className="text-sm font-semibold">{price}</p>
        <div className="mt-auto flex flex-wrap gap-4 pt-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <Link className="text-electric" href={`/events/${event.slug}`}>Event details</Link>
          {canRegister ? <Link className="text-navy" href={`/register?event=${event.slug}`}>Register</Link> : null}
        </div>
      </div>
    </article>
  );
}
