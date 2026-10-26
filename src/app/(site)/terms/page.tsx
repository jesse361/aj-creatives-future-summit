import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { getPage } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms", description: "Terms for using WHY US and attending its events." };

export default async function TermsPage() {
  const page = await getPage("terms");
  return (
    <>
      <PageHero eyebrow="Legal" title={page?.title || "Terms"} description="These terms are a starting point for the organizer to edit. They are not a substitute for legal advice." />
      <article className="mx-auto max-w-3xl whitespace-pre-line px-4 py-14 text-base leading-7 text-ink-soft sm:px-6">{page?.body}</article>
    </>
  );
}
