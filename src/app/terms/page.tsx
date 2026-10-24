import type { Metadata } from "next";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Registration terms",
  description: "Registration terms for The Future Summit.",
};

export default async function TermsPage() {
  const data = await getSiteData();
  return (
    <main className="page-wrap max-w-3xl py-16">
      <h1 className="text-5xl">Registration terms</h1>
      <div className="mt-6 space-y-4 leading-7">
        {(data?.settings.termsText ?? "The organizer has not published registration terms yet.").split("\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
