"use client";

import { useMemo, useState } from "react";
import { SpeakerCard } from "@/components/speaker-card";
import type { PublicSpeaker } from "@/lib/types";

export function SpeakerDirectory({ speakers }: { speakers: PublicSpeaker[] }) {
  const [topic, setTopic] = useState("All");
  const [category, setCategory] = useState("All");
  const topics = useMemo(() => ["All", ...new Set(speakers.flatMap((speaker) => speaker.expertise))], [speakers]);
  const categories = useMemo(() => ["All", ...new Set(speakers.flatMap((speaker) => speaker.categories))], [speakers]);
  const visible = speakers.filter((speaker) => {
    const topicMatch = topic === "All" || speaker.expertise.includes(topic);
    const categoryMatch = category === "All" || speaker.categories.includes(category);
    return topicMatch && categoryMatch;
  });

  if (speakers.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line bg-white p-8 text-slate">Speaker profiles have not been published yet.</p>;
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-navy">
          Topic
          <select className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3" value={topic} onChange={(event) => setTopic(event.target.value)}>
            {topics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">
          Session category
          <select className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-white p-8">No sample profiles match those filters.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((speaker) => (
            <SpeakerCard key={speaker.id} speaker={speaker} />
          ))}
        </div>
      )}
    </div>
  );
}
