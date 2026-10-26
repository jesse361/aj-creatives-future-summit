import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { ScheduleBoard } from "@/components/schedule-board";
import { ButtonLink, DemoNote } from "@/components/ui";
import { FORMAT_LABELS } from "@/lib/constants";
import { coverSrc, eventPlace } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { getEventBySlug, relatedEvents, toPublicSession } from "@/lib/queries";
import { formatDayLabel } from "@/lib/time";
import { isSafeImageSrc } from "@/lib/safe-url";

export const instant = false;

type Faq = { question: string; answer: string };

function faqsOf(value: unknown): Faq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || !("question" in item) || !("answer" in item)) return [];
    return [{ question: String(item.question), answer: String(item.answer) }];
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event" };
  const title = event.title;
  const description = event.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { title, description, images: event.coverImage ? [event.coverImage] : ["/images/hero.jpg"] },
  };
}

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ day?: string }> }) {
  const { slug } = await params;
  const { day } = await searchParams;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const sessions = event.sessions.map(toPublicSession);
  const speakers = event.speakers.map((link) => link.speaker).filter((speaker) => speaker.status === "PUBLISHED");
  const sponsors = event.sponsors.map((link) => link.sponsor).filter((sponsor) => sponsor.status === "APPROVED");
  const related = await relatedEvents(event.id, event.category);
  const faqs = faqsOf(event.faqs);
  const upcoming = event.status === "PUBLISHED";
  const jsonLd = event.isDemonstration
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.shortDescription,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        eventAttendanceMode: event.eventFormat === "ONLINE" ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: event.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
        image: event.coverImage || undefined,
        location: event.eventFormat === "ONLINE"
          ? { "@type": "VirtualLocation", url: `/events/${event.slug}` }
          : event.venueName
            ? { "@type": "Place", name: event.venueName, address: [event.venueAddress, event.city, event.country].filter(Boolean).join(", ") || undefined }
            : undefined,
      };

  return (
    <article>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <header className="relative min-h-[28rem] bg-navy text-white">
        <Image src={coverSrc(event.coverImage)} alt={event.coverAlt || "Illustrative event photograph. Not a confirmed WHY US photograph."} fill className="object-cover opacity-50" priority sizes="100vw" />
        <div className="hero-shade absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-gold">{event.category}</p>
            {event.isDemonstration ? <DemoNote /> : null}
            {event.status === "CANCELLED" ? <DemoNote>Cancelled</DemoNote> : null}
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl sm:text-6xl">{event.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{event.shortDescription}</p>
          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
            <div><dt className="text-mist">When</dt><dd>{formatDayLabel(event.startDate.toISOString(), event.timezone)}</dd></div>
            <div><dt className="text-mist">Where</dt><dd>{eventPlace(event)}</dd></div>
            <div><dt className="text-mist">Format</dt><dd>{FORMAT_LABELS[event.eventFormat]} · {event.timezone}</dd></div>
          </dl>
          {upcoming && event.status !== "CANCELLED" ? (
            <div className="mt-8 max-w-md">
              <Countdown startAt={event.startDate.toISOString()} endAt={event.endDate.toISOString()} />
            </div>
          ) : null}
          {event.registrationOpen && event.status === "PUBLISHED" ? (
            <div className="mt-8"><ButtonLink href={`/register?event=${event.slug}`}>Register</ButtonLink></div>
          ) : (
            <p className="mt-8 text-sm text-mist">Registration is closed for this event.</p>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_0.8fr] lg:px-8">
        <div className="grid gap-10">
          <section>
            <h2 className="font-display text-3xl text-navy">About this event</h2>
            <div className="mt-4 whitespace-pre-line text-base leading-7 text-ink-soft">{event.fullDescription}</div>
          </section>
          {event.eventFormat !== "IN_PERSON" && event.onlineDetails ? (
            <section>
              <h2 className="font-display text-3xl text-navy">Online participation</h2>
              <p className="mt-4 whitespace-pre-line leading-7 text-ink-soft">{event.onlineDetails}</p>
            </section>
          ) : null}
          <section>
            <h2 className="font-display text-3xl text-navy">Schedule</h2>
            <div className="mt-6"><ScheduleBoard sessions={sessions} timeZone={event.timezone} eventSlug={event.slug} activeDay={day} /></div>
          </section>
          <section>
            <h2 className="font-display text-3xl text-navy">Speakers</h2>
            <ul className="mt-4 grid gap-3">
              {speakers.map((speaker) => (
                <li key={speaker.id}><Link className="underline" href={`/speakers/${speaker.slug}`}>{speaker.name}</Link> <span className="text-ink-soft">· {speaker.professionalTitle}</span></li>
              ))}
              {speakers.length === 0 ? <li className="text-ink-soft">Speakers will be published with the programme.</li> : null}
            </ul>
          </section>
          {faqs.length ? (
            <section>
              <h2 className="font-display text-3xl text-navy">Questions</h2>
              <div className="mt-4 grid gap-4">
                {faqs.map((faq) => (
                  <details key={faq.question} className="border border-line bg-white p-4">
                    <summary className="cursor-pointer font-medium">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-6 text-ink-soft">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <aside className="grid h-fit gap-6">
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-2xl">Tickets</h2>
            <ul className="mt-4 grid gap-4">
              {event.ticketTypes.map((ticket) => (
                <li key={ticket.id} className="border-t border-line pt-3">
                  <p className="font-medium">{ticket.name}</p>
                  <p className="text-sm text-ink-soft">{ticket.description}</p>
                  <p className="mt-1">{ticket.priceMinor === 0 ? "Free" : formatMoney(ticket.priceMinor, ticket.currency)}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-mist">{Math.max(ticket.capacity - ticket.sold - ticket.reserved, 0)} available</p>
                  {ticket.isDemonstration ? <p className="text-xs text-ink-soft">Demonstration price</p> : null}
                </li>
              ))}
              {event.ticketTypes.length === 0 ? <li className="text-sm text-ink-soft">Tickets have not been published.</li> : null}
            </ul>
          </section>
          <section className="border border-line bg-white p-5">
            <h2 className="font-display text-2xl">Venue and access</h2>
            <p className="mt-3 text-sm leading-6">{[event.venueName, event.venueAddress, event.city, event.country].filter(Boolean).join(", ") || "Venue details have not been published."}</p>
            {event.travelInfo ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-soft">{event.travelInfo}</p> : null}
            {event.accessibilityInfo ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-soft">{event.accessibilityInfo}</p> : null}
          </section>
          {sponsors.length ? (
            <section className="border border-line bg-white p-5">
              <h2 className="font-display text-2xl">Sponsors</h2>
              <ul className="mt-3 grid gap-2 text-sm">
                {sponsors.map((sponsor) => (
                  <li key={sponsor.id}>{sponsor.website && isSafeImageSrc(sponsor.website) ? <a href={sponsor.website}>{sponsor.name}</a> : sponsor.name} · {sponsor.tier}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
      {event.gallery.length ? (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {event.gallery.filter((src) => isSafeImageSrc(src)).map((src) => (
            <div key={src} className="relative aspect-[4/3]">
              <Image src={src} alt="" fill className="object-cover" sizes="33vw" />
            </div>
          ))}
        </section>
      ) : null}
      {related.length ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl text-navy">Related events</h2>
          <ul className="mt-4 grid gap-3">
            {related.map((item) => <li key={item.id}><Link className="underline" href={`/events/${item.slug}`}>{item.title}</Link></li>)}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
