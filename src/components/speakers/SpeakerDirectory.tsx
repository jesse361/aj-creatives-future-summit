"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SiteData } from "@/lib/event-data";

type Speaker = SiteData["speakers"][number];

export function SpeakerDirectory({ speakers }: { speakers: Speaker[] }) {
  const topics = useMemo(() => {
    const values = new Set<string>();
    speakers.forEach((speaker) => speaker.expertise.forEach((topic) => values.add(topic)));
    return [...values];
  }, [speakers]);
  const [topic, setTopic] = useState("All");
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const visible = speakers.filter((speaker) => {
    const matchesTopic = topic === "All" || speaker.expertise.includes(topic);
    const haystack = `${speaker.name} ${speaker.organization} ${speaker.jobTitle}`.toLowerCase();
    return matchesTopic && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <label className="field md:max-w-sm">
          <span className="text-sm font-medium">Search speakers</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or organization" />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
          {["All", ...topics].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={topic === item}
              onClick={() => setTopic(item)}
              className={`rounded-full px-3 py-2 text-sm ${topic === item ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-line"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="surface-card mt-8 p-8 text-muted">No speaker profiles match that filter.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((speaker) => {
            const open = openSlug === speaker.slug;
            const initials = speaker.name
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase();
            return (
              <article key={speaker.slug} className="surface-card overflow-hidden">
                <div className="relative aspect-[4/5] bg-ink">
                  {speaker.portrait ? (
                    // Portraits may be organizer-supplied remote URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={speaker.portrait}
                      alt={speaker.isSample ? `Sample portrait placeholder for ${speaker.name}` : `${speaker.name} portrait`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#5578FF,transparent_45%),linear-gradient(160deg,#10182B,#0A1020)]">
                      <span className="font-display text-6xl text-lavender" aria-hidden>
                        {initials}
                      </span>
                    </div>
                  )}
                  {speaker.isSample ? (
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy">
                      Sample profile
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <h2 className="text-2xl">{speaker.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {speaker.jobTitle}
                    {speaker.organization ? ` · ${speaker.organization}` : ""}
                  </p>
                  {speaker.sessionTitle ? <p className="mt-3 text-sm font-medium text-action">{speaker.sessionTitle}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {speaker.expertise.map((item) => (
                      <span key={item} className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">
                        {item}
                      </span>
                    ))}
                  </div>
                  {open ? <p className="mt-4 text-sm leading-6">{speaker.bio}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="text-sm font-semibold text-action"
                      aria-expanded={open}
                      onClick={() => setOpenSlug(open ? null : speaker.slug)}
                    >
                      {open ? "Hide biography" : "Read biography"}
                    </button>
                    <Link href={`/speakers/${speaker.slug}`} className="text-sm font-semibold text-navy">
                      Full profile
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
