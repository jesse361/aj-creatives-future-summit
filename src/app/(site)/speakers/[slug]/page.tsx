import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Portrait } from "@/components/media-image";
import { DemoNote, PageHero } from "@/components/ui";
import { getSpeakerBySlug } from "@/lib/queries";
import { isHttpUrl } from "@/lib/safe-url";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const speaker = await getSpeakerBySlug(slug);
  if (!speaker) return { title: "Speaker" };
  return { title: speaker.name, description: speaker.biography.slice(0, 160), alternates: { canonical: `/speakers/${speaker.slug}` } };
}

export default async function SpeakerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const speaker = await getSpeakerBySlug(slug);
  if (!speaker) notFound();
  const links = Array.isArray(speaker.socialLinks) ? speaker.socialLinks.flatMap((item) => {
    if (!item || typeof item !== "object" || !("label" in item) || !("url" in item)) return [];
    const url = String(item.url);
    if (!isHttpUrl(url)) return [];
    return [{ label: String(item.label), url }];
  }) : [];
  const events = speaker.events.map((link) => link.event).filter((event) => event.status === "PUBLISHED");
  const sessions = speaker.sessions.map((link) => link.session).filter((session) => session.status === "PUBLISHED");
  return (
    <>
      <PageHero eyebrow={speaker.professionalTitle} title={speaker.name} description={speaker.organization || "WHY US speaker"} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <div>
          <Portrait name={speaker.name} src={speaker.portrait} className="aspect-square bg-navy text-6xl text-gold" />
          {speaker.isDemonstration ? <div className="mt-4"><DemoNote /></div> : null}
        </div>
        <div>
          <p className="whitespace-pre-line text-lg leading-8">{speaker.biography}</p>
          {speaker.expertise.length ? <p className="mt-6 text-sm uppercase tracking-[0.14em] text-electric">{speaker.expertise.join(" · ")}</p> : null}
          <ul className="mt-4 flex flex-wrap gap-4 text-sm">
            {links.map((link) => <li key={link.url}><a className="underline" href={link.url}>{link.label}</a></li>)}
          </ul>
          <h2 className="mt-10 font-display text-3xl text-navy">Sessions</h2>
          <ul className="mt-3 grid gap-2">
            {sessions.map((session) => <li key={session.id}>{session.title} · <Link className="underline" href={`/events/${session.event.slug}`}>{session.event.title}</Link></li>)}
            {sessions.length === 0 ? <li className="text-ink-soft">No published sessions yet.</li> : null}
          </ul>
          <h2 className="mt-8 font-display text-3xl text-navy">Events</h2>
          <ul className="mt-3 grid gap-2">
            {events.map((event) => <li key={event.id}><Link className="underline" href={`/events/${event.slug}`}>{event.title}</Link></li>)}
          </ul>
        </div>
      </div>
    </>
  );
}
