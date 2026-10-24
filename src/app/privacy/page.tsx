import type { Metadata } from "next";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy notice for The Future Summit registration and contact forms.",
};

export default async function PrivacyPage() {
  const data = await getSiteData();
  return (
    <main className="page-wrap max-w-3xl py-16">
      <h1 className="text-5xl">Privacy notice</h1>
      <div className="mt-6 space-y-4 leading-7 text-body">
        {(data?.settings.privacyNotice ?? "The organizer has not published a privacy notice yet.").split("\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
