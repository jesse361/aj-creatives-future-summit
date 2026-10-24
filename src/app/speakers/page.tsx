import type { Metadata } from "next";
import { SpeakerDirectory } from "@/components/speakers/SpeakerDirectory";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Speakers",
  description: "Speaker directory for The Future Summit 2027. Sample profiles are labeled and are not confirmed participants.",
};

export default async function SpeakersPage() {
  const data = await getSiteData();
  const speakers = data?.speakers ?? [];
  return (
    <main className="page-wrap py-16">
      <p className="text-xs tracking-[0.22em] text-action">AJ CREATIVES</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Speakers</h1>
      <p className="mt-4 max-w-2xl text-muted">
        A directory of people published for The Future Summit. Demonstration profiles are marked and do not represent confirmed participation or real credentials.
      </p>
      <div className="mt-10">
        {speakers.length === 0 ? (
          <p className="surface-card p-8 text-muted">Speaker profiles have not been published yet.</p>
        ) : (
          <SpeakerDirectory speakers={speakers} />
        )}
      </div>
    </main>
  );
}
