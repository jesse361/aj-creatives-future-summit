import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { getPage } from "@/lib/settings";

export const metadata: Metadata = { title: "About", description: "The mission, audience, and vision of WHY US." };

export default async function AboutPage() {
  const page = await getPage("about");
  return (
    <>
      <PageHero eyebrow="WHY US" title={page?.title || "Where ideas meet"} description="A platform for conferences, summits, workshops, and the people who make them worth attending." />
      <article className="mx-auto max-w-3xl whitespace-pre-line px-4 py-16 text-lg leading-8 text-ink-soft sm:px-6">
        {page?.body || "The organizer has not published the about page yet."}
      </article>
    </>
  );
}
