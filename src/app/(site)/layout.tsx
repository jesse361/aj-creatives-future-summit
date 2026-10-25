import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { eventNeedsPlaceholderNotice, getPublishedEvent } from "@/lib/event-data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const event = await getPublishedEvent();
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Suspense fallback={<div className="h-16 border-b border-white/10 bg-navy" />}>
        <SiteHeader />
      </Suspense>
      {event && eventNeedsPlaceholderNotice(event) ? (
        <p className="bg-[#ebe6ff] px-4 py-3 text-center text-sm leading-6 text-navy">
          Demonstration content. Dates, venue, speakers, prices, and sponsors stay placeholders until AJ CREATIVES confirms them.
        </p>
      ) : null}
      <main id="content" className="flex-1">
        {children}
      </main>
      <SiteFooter event={event} />
    </>
  );
}
