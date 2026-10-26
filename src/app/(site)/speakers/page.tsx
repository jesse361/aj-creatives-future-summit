import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoNote, EmptyState, PageHero } from "@/components/ui";
import { getPublishedSpeakers } from "@/lib/queries";
import { inputClass } from "@/lib/styles";

export const metadata: Metadata = { title: "Speakers", description: "Published speakers across WHY US events." };

export default function SpeakersPage({ searchParams }: { searchParams: Promise<{ q?: string; expertise?: string }> }) {
  return (
    <>
      <PageHero eyebrow="People" title="Speakers" description="Profiles are published by the organizer. Demonstration profiles are marked and are not confirmed appearances." />
      <Suspense fallback={<p className="px-4 py-10">Loading speakers…</p>}>
        <SpeakerResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SpeakerResults({ searchParams }: { searchParams: Promise<{ q?: string; expertise?: string }> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const expertise = params.expertise ?? "";
  const speakers = await getPublishedSpeakers();
  const tags = [...new Set(speakers.flatMap((speaker) => speaker.expertise))].sort();
  const filtered = speakers.filter((speaker) => {
    const haystack = `${speaker.name} ${speaker.professionalTitle} ${speaker.organization} ${speaker.biography}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (expertise && !speaker.expertise.includes(expertise)) return false;
    return true;
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <form className="grid gap-3 border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto]" action="/speakers">
        <label className="text-sm">Search<input className={inputClass} name="q" defaultValue={params.q ?? ""} /></label>
        <label className="text-sm">
          Expertise
          <select className={inputClass} name="expertise" defaultValue={expertise}>
            <option value="">All</option>
            {tags.map((tag) => <option key={tag}>{tag}</option>)}
          </select>
        </label>
        <button className="mt-6 min-h-11 bg-navy px-5 text-xs uppercase tracking-[0.16em] text-white">Filter</button>
      </form>
      {filtered.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((speaker) => (
            <Link key={speaker.id} href={`/speakers/${speaker.slug}`} className="border border-line bg-white p-5">
              <div className="grid h-16 w-16 place-items-center bg-paper font-display text-2xl">{speaker.name.slice(0, 1)}</div>
              <div className="mt-4">{speaker.isDemonstration ? <DemoNote /> : null}</div>
              <h2 className="mt-3 font-display text-3xl text-navy">{speaker.name}</h2>
              <p className="text-sm text-ink-soft">{speaker.professionalTitle}{speaker.organization ? `, ${speaker.organization}` : ""}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-soft">{speaker.biography}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8"><EmptyState title="No speakers match" body="Try another name or expertise area." action={{ href: "/speakers", label: "Clear filters" }} /></div>
      )}
    </div>
  );
}
