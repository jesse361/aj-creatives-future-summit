import type { Metadata } from "next";
import { getPublishedEvent } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Privacy policy · AJ CREATIVES",
  description: "How registration and contact information is handled for The Future Summit.",
};

export default async function PrivacyPage() {
  const event = await getPublishedEvent();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-navy">Privacy policy</h1>
      <div className="mt-6 whitespace-pre-wrap leading-8 text-slate">{event?.settings.privacyNotice}</div>
    </article>
  );
}
