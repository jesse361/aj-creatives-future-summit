import type { Metadata } from "next";
import { unsubscribeNewsletter } from "@/lib/audience";
import { syncNewsletterContact } from "@/lib/email";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };
export const instant = false;

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await unsubscribeNewsletter(token) : { ok: false as const };
  if (result.ok) {
    const subscriber = await import("@/lib/db").then(({ prisma }) => prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token! } }));
    if (subscriber) await syncNewsletterContact(subscriber.email, true);
  }
  return (
    <section className="mx-auto max-w-xl px-4 py-20">
      <h1 className="font-display text-4xl text-navy">{result.ok ? "You are unsubscribed." : "This unsubscribe link is not valid."}</h1>
      <p className="mt-4 text-ink-soft">{result.ok ? "You will not receive further newsletter messages unless you subscribe again." : "Request a new link by contacting the organizer."}</p>
    </section>
  );
}
