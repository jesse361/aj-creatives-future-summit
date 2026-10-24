import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Radio } from "lucide-react";
import { Countdown } from "@/components/countdown/Countdown";
import { formatLabel } from "@/lib/constants";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "The Future Summit 2027",
  description:
    "Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future. Presented by AJ Creatives.",
};

export default async function HomePage() {
  const data = await getSiteData();
  if (!data) {
    return (
      <main className="page-wrap py-24">
        <h1 className="text-4xl">The event database is not ready</h1>
        <p className="mt-4 max-w-xl text-muted">
          Run <code>npm run db:setup</code> to create the local database and load the demonstration content.
        </p>
      </main>
    );
  }

  const { event, speakers, sessions, tickets, sponsors } = data;
  const featured = speakers.filter((speaker) => speaker.featured).slice(0, 3);
  const previewSessions = sessions.slice(0, 4);
  const sampleSponsors = sponsors.some((sponsor) => sponsor.isSample);
  const jsonLd =
    event.datesConfirmed && event.venueConfirmed && event.startAt && event.venueName
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.name,
          description: event.description,
          startDate: event.startAt,
          endDate: event.endAt ?? undefined,
          eventAttendanceMode:
            event.format === "VIRTUAL"
              ? "https://schema.org/OnlineEventAttendanceMode"
              : event.format === "HYBRID"
                ? "https://schema.org/MixedEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: event.venueName,
            address: {
              "@type": "PostalAddress",
              streetAddress: event.venueAddress ?? undefined,
              addressLocality: event.venueCity ?? undefined,
              addressCountry: event.venueCountry ?? undefined,
            },
          },
          organizer: { "@type": "Organization", name: "AJ Creatives" },
        }
      : null;

  return (
    <main>
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      ) : null}
      {event.status !== "PUBLISHED" ? (
        <p className="bg-lavender/30 px-4 py-2 text-center text-sm text-navy">Preview: this event page is not published.</p>
      ) : null}
      <section className="theme-dark relative overflow-hidden bg-navy text-white">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(10,16,32,0.96) 0%, rgba(10,16,32,0.78) 46%, rgba(10,16,32,0.35) 100%), url(/images/hero.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          role="img"
          aria-label="Conference audience facing a lit keynote stage"
        />
        <div className="relative page-wrap grid items-end gap-10 py-16 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <p className="text-xs tracking-[0.28em] text-lavender">AJ CREATIVES PRESENTS</p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(3.2rem,8vw,6.6rem)] font-medium leading-[0.9] text-white">
              THE FUTURE
              <span className="block">SUMMIT</span>
              <span className="block text-lavender">2027</span>
            </h1>
            <p className="mt-5 font-display text-2xl text-white md:text-3xl">Ideas That Shape Tomorrow.</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-mist">
              Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future.
            </p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-xs tracking-[0.14em] text-lavender"><Calendar size={14} aria-hidden /> DATE</dt>
                <dd className="mt-2 text-sm leading-5 text-white">{event.whenLabel}</dd>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-xs tracking-[0.14em] text-lavender"><MapPin size={14} aria-hidden /> VENUE</dt>
                <dd className="mt-2 text-sm leading-5 text-white">
                  {event.venueConfirmed && event.venueName
                    ? `${event.venueName}${event.venueCity ? `, ${event.venueCity}` : ""}`
                    : "Venue to be confirmed"}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-xs tracking-[0.14em] text-lavender"><Radio size={14} aria-hidden /> FORMAT</dt>
                <dd className="mt-2 text-sm leading-5 text-white">{formatLabel(event.format)}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/tickets" className="btn btn-primary">
                Get your ticket <ArrowRight size={16} aria-hidden />
              </Link>
              <a href="#why-attend" className="btn btn-secondary">
                Explore the event
              </a>
            </div>
          </div>
          <Countdown
            startAt={event.startAt}
            endAt={event.endAt}
            timezone={event.timezone}
            datesConfirmed={event.datesConfirmed}
          />
        </div>
      </section>

      <section id="why-attend" className="page-wrap py-20">
        <p className="text-xs tracking-[0.22em] text-action">01 — THE GATHERING</p>
        <h2 className="mt-3 max-w-3xl text-4xl md:text-6xl">WHY ATTEND?</h2>
        <p className="mt-4 max-w-2xl text-muted">
          These are the reasons the summit is being built. Speaker and session claims follow what is currently published, and sample profiles stay labeled.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {event.whyAttend.map((item, index) => (
            <article key={item.title} className="surface-card p-6">
              <p className="font-display text-sm text-electric">0{index + 1}</p>
              <h3 className="mt-3 text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="page-wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.22em] text-action">02 — VOICES</p>
              <h2 className="mt-3 text-4xl md:text-5xl">Featured speakers</h2>
            </div>
            <Link href="/speakers" className="btn btn-ghost">
              All speakers
            </Link>
          </div>
          {speakers.some((speaker) => speaker.isSample) ? (
            <p className="mt-4 max-w-2xl text-sm text-muted">
              Profiles marked as samples are demonstration content. They are not confirmed participants and their biographies are fictional.
            </p>
          ) : null}
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {(featured.length ? featured : speakers.slice(0, 3)).map((speaker) => (
              <article key={speaker.slug} className="overflow-hidden rounded-3xl bg-ink text-white">
                <div className="relative h-64">
                  {speaker.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={speaker.portrait} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full bg-[radial-gradient(circle_at_top,#5578FF,transparent_50%),linear-gradient(#10182B,#0A1020)]" />
                  )}
                </div>
                <div className="p-5">
                  {speaker.isSample ? <p className="text-xs uppercase tracking-[0.14em] text-lavender">Sample profile</p> : null}
                  <h3 className="mt-2 text-2xl text-white">{speaker.name}</h3>
                  <p className="mt-1 text-sm text-mist">{speaker.jobTitle} · {speaker.organization}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-mist">{speaker.bio}</p>
                  {speaker.sessionTitle ? <p className="mt-3 text-sm text-lavender">{speaker.sessionTitle}</p> : null}
                  <Link href={`/speakers/${speaker.slug}`} className="mt-4 inline-flex text-sm font-semibold text-white">
                    View profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {speakers.length === 0 ? <p className="mt-6 text-muted">Speaker profiles will appear here once they are published.</p> : null}
        </div>
      </section>

      <section className="page-wrap py-20">
        <p className="text-xs tracking-[0.22em] text-action">03 — THEMES</p>
        <h2 className="mt-3 text-4xl md:text-5xl">Event highlights</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {event.highlights.map((item) => (
            <article key={item.title} className="relative min-h-64 overflow-hidden rounded-3xl bg-ink text-white">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(to top, rgba(10,16,32,0.92), rgba(10,16,32,0.2)), url(${item.image})` }}
                aria-hidden
              />
              <div className="relative flex h-full min-h-64 flex-col justify-end p-6">
                <h3 className="text-3xl text-white">{item.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-mist">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="page-wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.22em] text-action">04 — AGENDA</p>
              <h2 className="mt-3 text-4xl md:text-5xl">Schedule preview</h2>
            </div>
            <Link href="/schedule" className="btn btn-ghost">View full schedule</Link>
          </div>
          {sessions.some((session) => session.isSample) ? (
            <p className="mt-4 text-sm text-muted">These times are a sample agenda until the event date is confirmed.</p>
          ) : null}
          <ol className="mt-8 grid gap-3">
            {previewSessions.map((session) => (
              <li key={session.id} className="grid gap-2 rounded-2xl border border-line px-4 py-4 md:grid-cols-[160px_1fr_auto] md:items-center">
                <time className="text-sm text-muted" dateTime={session.startAt}>{session.dayLabel} · {session.timeLabel}</time>
                <span className="font-display text-xl text-navy">{session.title}</span>
                <span className="text-sm text-muted">{session.speakers.map((speaker) => speaker.name).join(", ") || session.category}</span>
              </li>
            ))}
          </ol>
          {previewSessions.length === 0 ? <p className="mt-6 text-muted">The schedule has not been published.</p> : null}
        </div>
      </section>

      <section className="page-wrap py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-action">05 — ACCESS</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Tickets</h2>
          </div>
          <Link href="/tickets" className="btn btn-primary">Register now</Link>
        </div>
        {tickets.some((ticket) => ticket.isSample) ? (
          <p className="mt-4 text-sm text-muted">Prices shown with a sample label are demonstration data, not official rates.</p>
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="surface-card p-6">
              <h3 className="text-2xl">{ticket.name}</h3>
              <p className="mt-3 font-display text-3xl">{ticket.priceLabel}</p>
              <p className="mt-2 text-sm text-muted">{ticket.description}</p>
              <Link href="/tickets" className="mt-5 inline-flex text-sm font-semibold text-action">Select this ticket</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink py-20 text-white">
        <div className="page-wrap grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs tracking-[0.22em] text-lavender">06 — PLACE</p>
            <h2 className="mt-3 text-4xl text-white">Venue</h2>
          </div>
          {event.venueConfirmed && event.venueName ? (
            <div>
              <p className="font-display text-3xl text-white">{event.venueName}</p>
              <p className="mt-2 text-mist">
                {[event.venueAddress, event.venueCity, event.venueCountry].filter(Boolean).join(", ")}
              </p>
              {event.hoursLabel ? <p className="mt-3 text-sm text-mist">{event.hoursLabel}</p> : null}
              {event.travelSummary ? <p className="mt-4 max-w-xl text-sm leading-6 text-mist">{event.travelSummary}</p> : null}
              {event.directionsUrl ? (
                <a className="mt-4 inline-flex text-sm font-semibold text-lavender" href={event.directionsUrl}>
                  Directions
                </a>
              ) : null}
              {event.mapEmbedUrl ? (
                <iframe title="Venue map" src={event.mapEmbedUrl} className="mt-6 h-72 w-full rounded-2xl border-0" loading="lazy" />
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
              <h3 className="text-3xl text-white">Venue details coming soon</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-mist">
                The city, address, travel notes, and map will appear here after AJ Creatives confirms the location. No travel time, parking, or hotel details are invented on this page.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="page-wrap py-20">
        <p className="text-xs tracking-[0.22em] text-action">07 — WITH</p>
        <h2 className="mt-3 text-4xl md:text-5xl">Sponsors and partners</h2>
        {sponsors.length === 0 ? (
          <p className="mt-6 text-muted">Sponsor and partner announcements will appear here once AJ Creatives confirms them.</p>
        ) : (
          <>
            {sampleSponsors ? (
              <p className="mt-4 max-w-2xl text-sm text-muted">
                These logos are demonstration placeholders for layout. They are not confirmed sponsors or partners.
              </p>
            ) : null}
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {sponsors.map((sponsor) => (
                <li key={sponsor.id} className="surface-card grid min-h-32 place-items-center p-6">
                  {sponsor.website ? (
                    <a href={sponsor.website} rel="noreferrer" className="text-center">
                      {sponsor.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sponsor.logo} alt={`${sponsor.name} logo${sponsor.isSample ? " (sample)" : ""}`} className="mx-auto h-16 w-auto" />
                      ) : (
                        <span className="font-display text-xl">{sponsor.name}</span>
                      )}
                    </a>
                  ) : sponsor.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sponsor.logo} alt={`${sponsor.name} logo${sponsor.isSample ? " (sample)" : ""}`} className="h-16 w-auto" />
                  ) : (
                    <span className="font-display text-xl">{sponsor.name}</span>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">{sponsor.tier}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="theme-dark bg-navy py-20 text-white">
        <div className="page-wrap">
          <h2 className="max-w-3xl text-4xl text-white md:text-6xl">{event.ctaHeadline}</h2>
          <p className="mt-4 max-w-xl text-mist">{event.ctaText}</p>
          <Link href="/tickets" className="btn btn-light mt-8">
            Register for the summit
          </Link>
        </div>
      </section>
    </main>
  );
}
