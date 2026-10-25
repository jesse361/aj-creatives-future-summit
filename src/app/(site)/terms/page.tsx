import type { Metadata } from "next";
import { getPublishedEvent } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Registration terms · AJ CREATIVES",
  description: "Registration terms for The Future Summit. Sample terms apply until the organizer replaces them.",
};

export default async function TermsPage() {
  const event = await getPublishedEvent();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-navy">Registration terms</h1>
      <div className="mt-6 whitespace-pre-wrap leading-8 text-slate">{event?.settings.termsText}</div>
    </article>
  );
}
