import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { getPublishedFaqs } from "@/lib/queries";

export const metadata: Metadata = { title: "FAQ", description: "Questions about WHY US events, tickets, and attendance." };

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();
  const groups = [...new Set(faqs.map((faq) => faq.category))];
  return (
    <>
      <PageHero eyebrow="Help" title="Questions" description="Answers published by the organizer." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {groups.map((group) => (
          <section key={group} className="mb-10">
            <h2 className="font-display text-2xl text-navy">{group}</h2>
            <div className="mt-4 grid gap-3">
              {faqs.filter((faq) => faq.category === group).map((faq) => (
                <details key={faq.id} className="border border-line bg-white p-4">
                  <summary className="cursor-pointer font-medium">{faq.question}</summary>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-soft">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        {faqs.length === 0 ? <p className="text-ink-soft">No questions have been published yet.</p> : null}
      </div>
    </>
  );
}
