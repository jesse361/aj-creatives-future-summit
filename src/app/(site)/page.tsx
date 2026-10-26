import Image from "next/image";
import Link from "next/link";
import { Compass, Handshake, Mic2, Sparkles, Users, Waypoints } from "lucide-react";
import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { EventCard } from "@/components/event-card";
import { Portrait } from "@/components/media-image";
import { NewsletterForm } from "@/components/newsletter-form";
import { ButtonLink, DemoNote, SectionHeading } from "@/components/ui";
import { FORMAT_LABELS } from "@/lib/constants";
import { eventPlace } from "@/lib/format";
import { benefitItems, getPage, getSettings } from "@/lib/settings";
import { getApprovedSponsors, getApprovedTestimonials, getFeaturedEvent, getPreviewSessions, getPublishedSpeakers, getUpcomingPublished } from "@/lib/queries";
import { formatDayLabel, formatTimeRange } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    openGraph: { title: settings.seoTitle, description: settings.seoDescription },
  };
}

const experienceImages = [
  { src: "/images/hero.jpg", title: "Conferences", text: "Rooms built for ideas that need an audience." },
  { src: "/images/stage.jpg", title: "Summits", text: "Stages for the conversations that move a field forward." },
  { src: "/images/workshop.jpg", title: "Workshops", text: "Smaller rooms, practical work, and time to try the idea." },
  { src: "/images/networking.jpg", title: "Networking", text: "Introductions with a point, not a pile of badges." },
  { src: "/images/conversation.jpg", title: "Private gatherings", text: "Corporate and invitation-led experiences, hosted with care." },
];

const icons = [Handshake, Mic2, Sparkles, Compass, Users, Waypoints];

export default async function HomePage() {
  const [settings, about, benefitsPage, featured, upcoming, speakers, sponsors, testimonials] = await Promise.all([
    getSettings(),
    getPage("home-about"),
    getPage("benefits"),
    getFeaturedEvent(),
    getUpcomingPublished(6),
    getPublishedSpeakers(),
    getApprovedSponsors(),
    getApprovedTestimonials(),
  ]);
  const benefits = benefitItems(benefitsPage?.body);
  const previewEvent = upcoming[0];
  const previewSessions = previewEvent ? await getPreviewSessions(previewEvent.id) : [];

  return (
    <>
      <section className="relative min-h-[78vh] overflow-hidden bg-navy text-white">
        <Image src="/images/hero.jpg" alt="Illustrative photograph of a conference audience. Not a confirmed WHY US event." fill priority className="object-cover" sizes="100vw" />
        <div className="hero-shade absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{settings.legalName}</p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl">
              WHERE IDEAS MEET.
              <span className="mt-2 block">WHERE CONNECTIONS BEGIN.</span>
            </h1>
            <div className="gold-rule mt-6" />
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
              Discover exceptional conferences, connect with inspiring people, and experience events designed to turn ideas into opportunities.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/events">Explore Events</ButtonLink>
              <ButtonLink href="/about" variant="secondary">Discover WHY US</ButtonLink>
            </div>
          </div>
          <aside className="border border-white/15 bg-navy/70 p-6 backdrop-blur lg:col-span-5">
            {featured ? (
              <>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">Next event</p>
                <h2 className="mt-3 font-display text-3xl">{featured.title}</h2>
                <p className="mt-3 text-sm text-mist">{formatDayLabel(featured.startDate.toISOString(), featured.timezone)}</p>
                <p className="text-sm text-mist">{eventPlace(featured)} · {FORMAT_LABELS[featured.eventFormat]}</p>
                <div className="mt-5">
                  <Countdown startAt={featured.startDate.toISOString()} endAt={featured.endDate.toISOString()} />
                </div>
                <div className="mt-6">
                  <ButtonLink href={`/events/${featured.slug}`} variant="light">View event</ButtonLink>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">The platform</p>
                <h2 className="mt-3 font-display text-3xl">{settings.secondaryTagline}</h2>
                <p className="mt-4 text-sm leading-6 text-mist">
                  No confirmed upcoming event is published yet. Explore the programme as announcements are added, or preview the demonstration content in the directory.
                </p>
                <div className="mt-6">
                  <ButtonLink href="/events" variant="light">Explore future announcements</ButtonLink>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="The programme" title="Upcoming events" description="Published events from the WHY US calendar. Demonstration entries are labeled until the owner replaces them." />
          <ButtonLink href="/events" variant="ghost">All events</ButtonLink>
        </div>
        {upcoming.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-line px-6 py-12 text-ink-soft">Published events will appear here. Nothing is confirmed yet.</p>
        )}
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading light eyebrow="Why WHY US" title="Why choose WHY US?" description="A conference platform for people who want the room to matter." />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = icons[index % icons.length];
              return (
                <article key={benefit.title} className="border-t border-white/15 pt-5">
                  <div className="flex items-center justify-between">
                    <Icon aria-hidden className="text-gold" size={20} />
                    <span className="font-display text-gold">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-mist">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionHeading eyebrow="The company" title={about?.title || "People, ideas, and opportunities"} description={about?.body || "WHY US is the home for conferences, summits, workshops, and private gatherings that bring serious people into the same room."} />
          <div className="mt-8">
            <ButtonLink href="/about">Read our story</ButtonLink>
          </div>
        </div>
        <div className="relative min-h-80">
          <Image src="/images/conversation.jpg" alt="Illustrative photograph of a professional conversation. Not a confirmed WHY US event." fill className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" />
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Voices" title="Featured speakers" description="Published profiles only. Demonstration profiles are marked and are not confirmed appearances." />
          {speakers.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {speakers.slice(0, 4).map((speaker) => (
                <Link key={speaker.id} href={`/speakers/${speaker.slug}`} className="group border border-line p-4">
                  <Portrait name={speaker.name} src={speaker.portrait} className="aspect-square text-4xl text-navy" />
                  <div className="mt-4 flex flex-wrap gap-2">{speaker.isDemonstration ? <DemoNote /> : null}</div>
                  <h3 className="mt-3 font-display text-2xl group-hover:text-electric">{speaker.name}</h3>
                  <p className="text-sm text-ink-soft">{speaker.professionalTitle}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-ink-soft">Speaker profiles will appear when they are published.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Agenda" title="Schedule preview" description={previewEvent ? `Sessions from ${previewEvent.title}.` : "A published agenda will appear with the next event."} />
        {previewEvent?.isDemonstration ? <div className="mt-4"><DemoNote>Demonstration agenda</DemoNote></div> : null}
        <div className="mt-8 grid gap-4">
          {previewSessions.map((session) => (
            <article key={session.id} className="grid gap-2 border-b border-line py-4 md:grid-cols-[180px_1fr]">
              <p className="text-sm text-electric">{formatTimeRange(session.startAt, session.endAt, previewEvent?.timezone || "UTC")}</p>
              <div>
                <h3 className="font-display text-2xl text-navy">{session.title}</h3>
                <p className="text-sm text-ink-soft">{session.speakers.map((speaker) => speaker.name).join(", ") || session.category}</p>
              </div>
            </article>
          ))}
          {previewSessions.length === 0 ? <p className="text-ink-soft">No published sessions yet.</p> : null}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading light eyebrow="Experiences" title="Built for the way people gather" />
          <div className="mt-10 grid gap-4 md:grid-cols-4 md:grid-rows-2">
            {experienceImages.map((item, index) => (
              <article key={item.title} className={`relative min-h-56 overflow-hidden ${index === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[36rem]" : ""}`}>
                <Image src={item.src} alt={`Illustrative photograph representing ${item.title.toLowerCase()}. Not a confirmed WHY US event.`} fill className="object-cover" sizes="(min-width: 768px) 25vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <h3 className="font-display text-3xl">{item.title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-white/80">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {sponsors.length ? (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Partners" title="Sponsors and partners" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="border border-line bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{sponsor.tier}</p>
                <p className="mt-3 font-display text-2xl">{sponsor.name}</p>
                {sponsor.website ? <a className="mt-3 inline-block text-sm text-electric" href={sponsor.website}>Visit</a> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {testimonials.length ? (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="From the room" title="Approved testimonials" />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {testimonials.map((item) => (
                <blockquote key={item.id} className="border border-line p-6">
                  <p className="text-lg leading-8 text-navy">“{item.quote}”</p>
                  <footer className="mt-4 text-sm text-ink-soft">{item.name}{item.role ? `, ${item.role}` : ""}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-4xl">Stay close to the next gathering.</h2>
            <p className="mt-3 text-sm leading-6 text-mist">Subscribe with your consent. You can unsubscribe at any time.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-electric">WHY US</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl text-navy sm:text-6xl">YOUR NEXT GREAT EXPERIENCE STARTS HERE.</h2>
        <div className="mt-8">
          <ButtonLink href="/events">Explore upcoming events</ButtonLink>
        </div>
      </section>
    </>
  );
}
