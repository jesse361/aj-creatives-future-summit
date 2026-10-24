import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteData } from "@/lib/event-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiteData();
  const speaker = data?.speakers.find((item) => item.slug === slug);
  if (!speaker) return { title: "Speaker" };
  return {
    title: speaker.name,
    description: speaker.isSample
      ? `Sample speaker profile for demonstration. ${speaker.name} is not a confirmed participant.`
      : `${speaker.name}, ${speaker.jobTitle} at ${speaker.organization}.`,
  };
}

export default async function SpeakerProfilePage({ params }: Props) {
  const { slug } = await params;
  const data = await getSiteData();
  const speaker = data?.speakers.find((item) => item.slug === slug);
  if (!speaker) notFound();
  const socials = Object.entries(speaker.socialLinks);
  return (
    <main className="page-wrap py-16">
      <Link href="/speakers" className="text-sm font-semibold text-action">
        All speakers
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink">
          {speaker.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={speaker.portrait}
              alt={speaker.isSample ? `Sample portrait placeholder for ${speaker.name}` : `${speaker.name} portrait`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-6xl text-lavender">
              {speaker.name.slice(0, 1)}
            </div>
          )}
        </div>
        <article>
          {speaker.isSample ? (
            <p className="rounded-2xl bg-lavender/25 px-4 py-3 text-sm text-navy">
              Demonstration profile. This person has not been confirmed as a speaker, and the biography is fictional placeholder copy.
            </p>
          ) : null}
          <h1 className="mt-4 text-5xl">{speaker.name}</h1>
          <p className="mt-3 text-lg text-muted">
            {speaker.jobTitle} · {speaker.organization}
          </p>
          {speaker.sessionTitle ? <p className="mt-4 font-medium text-action">{speaker.sessionTitle}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {speaker.expertise.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-line">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl leading-7">{speaker.bio}</p>
          {socials.length ? (
            <ul className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} rel="noreferrer" className="text-action">
                    {key}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted">No social profiles have been added for this speaker.</p>
          )}
        </article>
      </div>
    </main>
  );
}
