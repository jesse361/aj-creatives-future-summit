import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { SpeakerDirectory } from "@/components/speaker-directory";
import { Portrait } from "@/components/portrait";
import { DynamicMarker } from "@/components/dynamic-marker";
import { getPublishedEvent } from "@/lib/event-data";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getPublishedEvent();
  const title = `Speakers · ${event?.name ?? "THE FUTURE SUMMIT 2027"} · AJ CREATIVES`;
  const description = "Speaker profiles for The Future Summit. Sample profiles are marked and are not confirmed appearances.";
  return { title, description, openGraph: { title, description } };
}

export default async function SpeakersPage() {
  const event = await getPublishedEvent();
  if (!event) notFound();
  return (
    <>
      <PageIntro eyebrow={event.settings.organizerName} title="Speakers" description="A directory of the published programme. Anyone marked as a sample profile is fictional demonstration content and has not confirmed participation." />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SpeakerDirectory speakers={event.speakers} />
      </div>
    </>
  );
}

export function SpeakerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Loading profile…</p>}>
      <SpeakerProfile params={params} />
    </Suspense>
  );
}

async function SpeakerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublishedEvent();
  const speaker = event?.speakers.find((item) => item.slug === slug);
  if (!event || !speaker) notFound();
  const sessions = event.sessions.filter((session) => session.speakers.some((person) => person.slug === speaker.slug));
  return (
    <>
      <DynamicMarker />
      <article className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink">
          <Portrait src={speaker.portraitUrl} name={speaker.name} sample={speaker.isSample || speaker.portraitIsSample} />
        </div>
        <div>
          {speaker.isSample ? <p className="rounded-2xl bg-lavender/20 px-4 py-3 text-sm leading-6 text-navy">Sample profile. This person has not confirmed participation, and the biography is placeholder copy.</p> : null}
          <h1 className="mt-4 font-display text-4xl text-navy sm:text-5xl">{speaker.name}</h1>
          <p className="mt-3 text-lg text-electric-deep">
            {speaker.jobTitle} · {speaker.organization}
          </p>
          <div className="mt-6 whitespace-pre-wrap leading-8 text-slate">{speaker.biography}</div>
          {speaker.expertise.length ? (
            <p className="mt-6 text-sm font-medium text-navy">Expertise: {speaker.expertise.join(", ")}</p>
          ) : null}
          {sessions.length ? (
            <div className="mt-6">
              <h2 className="font-display text-2xl text-navy">Sessions</h2>
              <ul className="mt-3 space-y-2">
                {sessions.map((session) => (
                  <li key={session.id}>{session.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {speaker.socialLinks.length ? (
            <ul className="mt-6 flex flex-wrap gap-4">
              {speaker.socialLinks.map((link) => (
                <li key={link.url}>
                  <a className="font-semibold text-electric-deep" href={link.url} rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </>
  );
}
