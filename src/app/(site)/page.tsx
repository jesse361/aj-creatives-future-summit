import Image from "next/image";
import Link from "next/link";
import { Compass, Cpu, Lightbulb, PenTool, Users } from "lucide-react";
import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { JsonLd } from "@/components/json-ld";
import { SpeakerCard } from "@/components/speaker-card";
import { SponsorGrid } from "@/components/sponsor-grid";
import { Badge, ButtonLink, SectionHeading } from "@/components/ui";
import { VenuePanel } from "@/components/venue-panel";
import { FORMAT_LABELS } from "@/lib/constants";
import { getPublishedEvent } from "@/lib/event-data";
import { formatMoney } from "@/lib/money";
import { buildStructuredData } from "@/lib/structured-data";
import { formatTimeRange } from "@/lib/time";
import { isSafeImageSrc } from "@/lib/safe-url";

const icons = [Lightbulb, Cpu, Users, PenTool, Compass];

export async function generateMetadata(): Promise<Metadata> {
  const event = await getPublishedEvent();
  const title = `${event?.name ?? "THE FUTURE SUMMIT 2027"} · AJ CREATIVES`;
  const description = event?.settings.heroDescription ?? "Ideas That Shape Tomorrow.";
  return { title, description, openGraph: { title, description } };
}

function Unpublished() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="font-display text-4xl text-navy">The Future Summit</h1>
      <p className="mt-4 leading-7">This event has not been published yet.</p>
    </section>
  );
}

export default async function HomePage() {
  const event = await getPublishedEvent();
  if (!event) return <Unpublished />;

  const featured = event.speakers.filter((speaker) => speaker.featured);
  const speakers = (featured.length ? featured : event.speakers).slice(0, 4);
  const previewSessions = event.sessions.slice(0, 5);
  const dateLabel = event.datesConfirmed ? `${event.startAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: event.timezone }).format(new Date(event.startAt)) : ""}` : "[EVENT DATE]";
  const venueLabel = event.venue.confirmed ? [event.venue.name, event.venue.city].filter(Boolean).join(", ") : "[VENUE NAME, CITY]";
  const formatLabel = event.formatConfirmed && event.format ? FORMAT_LABELS[event.format] ?? event.format : "[IN-PERSON, VIRTUAL, OR HYBRID]";
  const hero = event.heroImageUrl && isSafeImageSrc(event.heroImageUrl) && event.heroImageUrl.startsWith("/") ? event.heroImageUrl : "/images/hero.jpg";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <JsonLd data={buildStructuredData(event, siteUrl)} />
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0">
          <Image
            src={hero}
            alt="Illustrative photograph of a conference audience. Not a photograph of The Future Summit."
            fill
            priority
            className="object-cover opacity-40"
            sizes="100vw"
          />
          <div className="hero-shade absolute inset-0" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lavender">{event.settings.heroEyebrow}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-7xl">{event.name}</h1>
            <p className="mt-4 font-display text-2xl text-white sm:text-3xl">{event.tagline}</p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-mist">{event.settings.heroDescription}</p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Date", dateLabel],
                ["Venue", venueLabel],
                ["Format", formatLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                  <dt className="text-xs uppercase tracking-[0.16em] text-mist">{label}</dt>
                  <dd className="mt-1 font-medium text-white">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/tickets">GET YOUR TICKET</ButtonLink>
              <ButtonLink href="#why-attend" variant="secondary">
                EXPLORE THE EVENT
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-5">
            <Countdown
              startAt={event.startAt}
              endAt={event.endAt}
              datesConfirmed={event.datesConfirmed}
              nextEventUrl={event.settings.nextEventUrl}
              nextEventLabel={event.settings.nextEventLabel}
            />
          </div>
        </div>
      </section>

      <section id="why-attend" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="The gathering" title="WHY ATTEND?" description="These reasons describe the published programme. Sample sessions are marked anywhere the agenda is still a demonstration." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {event.settings.whyAttend.map((item, index) => {
            const Icon = icons[index % icons.length] ?? Lightbulb;
            return (
              <article key={item.title} className="rounded-3xl border border-line bg-white p-6">
                <Icon className="text-electric-deep" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl text-navy">{item.title}</h3>
                <p className="mt-2 leading-7 text-slate">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Programme" title="Featured speakers" description="Profiles marked Sample are demonstration people. They have not confirmed participation." />
            <Link href="/speakers" className="text-sm font-semibold text-electric-deep">
              All speakers
            </Link>
          </div>
          {speakers.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {speakers.map((speaker) => (
                <SpeakerCard key={speaker.id} speaker={speaker} />
              ))}
            </div>
          ) : (
            <p className="mt-8">Speaker profiles have not been published yet.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Themes" title="What the summit explores" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {event.settings.highlights.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-3xl bg-ink text-white">
              {item.image && isSafeImageSrc(item.image) && item.image.startsWith("/") ? (
                <div className="relative h-48">
                  <Image src={item.image} alt="" fill className="object-cover opacity-70" sizes="(min-width: 768px) 50vw, 100vw" />
                </div>
              ) : null}
              <div className="p-6">
                <h3 className="font-display text-2xl">{item.title}</h3>
                <p className="mt-2 leading-7 text-mist">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Agenda" title="Schedule preview" description={event.datesConfirmed ? "A short look at the published agenda." : "A short look at the sample agenda. Times are not a confirmed schedule."} />
            <ButtonLink href="/schedule" variant="ghost">
              View the full schedule
            </ButtonLink>
          </div>
          {previewSessions.length === 0 ? (
            <p className="mt-8">The schedule has not been published yet.</p>
          ) : (
            <ol className="mt-8 space-y-3">
              {previewSessions.map((session) => (
                <li key={session.id} className="grid gap-2 rounded-3xl border border-line bg-paper px-5 py-4 sm:grid-cols-[9rem_1fr]">
                  <time className="font-semibold text-navy" dateTime={session.startAt}>
                    {formatTimeRange(session.startAt, session.endAt, event.timezone)}
                  </time>
                  <div>
                    <p className="font-display text-lg text-navy">{session.title}</p>
                    <p className="text-sm text-slate">
                      {session.speakers.map((speaker) => speaker.name).join(", ") || (session.isBreak ? "Break" : "Speaker to be announced")}
                      {session.isSample ? " · Sample" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Attendance" title="Tickets" description={event.settings.currencyConfirmed ? "Choose a published ticket." : "Prices below are demonstration amounts. The currency is not confirmed. GHS can be used if the organizer sets it."} />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {event.tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-3xl border border-line bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl text-navy">{ticket.name}</h3>
                {ticket.isSample ? <Badge>Sample price</Badge> : null}
              </div>
              <p className="mt-3 text-3xl font-semibold text-navy">{ticket.priceCents === 0 ? "Free" : formatMoney(ticket.priceCents, ticket.currency)}</p>
              <p className="mt-3 text-sm leading-6 text-slate">{ticket.description}</p>
            </article>
          ))}
        </div>
        <ButtonLink href="/tickets" className="mt-8">
          Register for the summit
        </ButtonLink>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Place" title="Venue" />
          <div className="mt-8">
            <VenuePanel event={event} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Support" title="Sponsors and partners" />
        <div className="mt-8">
          <SponsorGrid sponsors={event.sponsors} />
        </div>
      </section>

      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">{event.settings.ctaHeadline}</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-mist">{event.settings.ctaDescription}</p>
          <ButtonLink href="/tickets" variant="light" className="mt-8">
            REGISTER FOR THE SUMMIT
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
