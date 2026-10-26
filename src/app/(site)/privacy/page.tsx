import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { getPage } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy", description: "How WHY US handles personal information." };

export default async function PrivacyPage() {
  const page = await getPage("privacy");
  return (
    <>
      <PageHero eyebrow="Legal" title={page?.title || "Privacy"} description="This notice explains what the site collects. Have it reviewed for your jurisdiction before you rely on it." />
      <article className="mx-auto max-w-3xl whitespace-pre-line px-4 py-14 text-base leading-7 text-ink-soft sm:px-6">{page?.body}</article>
    </>
  );
}
