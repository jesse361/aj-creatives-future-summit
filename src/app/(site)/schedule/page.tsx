import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/schedule-board";
import { DemoNote, EmptyState, PageHero } from "@/components/ui";
import { getUpcomingPublished, toPublicSession } from "@/lib/queries";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Schedule", description: "Published session times for WHY US events." };

export default function SchedulePage({ searchParams }: { searchParams: Promise<{ event?: string; day?: string; category?: string }> }) {
  return (
    <>
      <PageHero eyebrow="Agenda" title="Schedule" description="Day by day, in the event timezone. Only published sessions are shown." />
      <Suspense fallback={<p className="px-4 py-10">Loading the agenda…</p>}>
        <Agenda searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Agenda({ searchParams }: { searchParams: Promise<{ event?: string; day?: string; category?: string }> }) {
  const params = await searchParams;
  const events = await getUpcomingPublished(20);
  const selected = events.find((event) => event.slug === params.event) ?? events[0];
  if (!selected) return <div className="mx-auto max-w-6xl px-4 py-12"><EmptyState title="No agenda yet" body="A schedule appears when an upcoming event is published." /></div>;
  const rows = await prisma.session.findMany({
    where: { eventId: selected.id, status: "PUBLISHED" },
    orderBy: [{ startTime: "asc" }, { displayOrder: "asc" }],
    include: { speakers: { include: { speaker: true } } },
  });
  const categories = [...new Set(rows.map((session) => session.category))];
  const visible = params.category ? rows.filter((session) => session.category === params.category) : rows;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        {selected.isDemonstration ? <DemoNote>Demonstration agenda</DemoNote> : null}
        <p className="text-sm text-ink-soft">{selected.title}</p>
      </div>
      <form className="mt-4 flex flex-wrap gap-3" action="/schedule">
        <label className="text-sm">
          Event
          <select className="mt-2 block border border-line bg-white px-3 py-3" name="event" defaultValue={selected.slug}>
            {events.map((event) => <option key={event.id} value={event.slug}>{event.title}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Session type
          <select className="mt-2 block border border-line bg-white px-3 py-3" name="category" defaultValue={params.category ?? ""}>
            <option value="">All</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <button className="mt-7 min-h-11 bg-navy px-4 text-xs uppercase tracking-[0.14em] text-white">Show</button>
      </form>
      <div className="mt-8">
        <ScheduleBoard sessions={visible.map(toPublicSession)} timeZone={selected.timezone} activeDay={params.day} eventSlug={selected.slug} />
      </div>
      <p className="mt-6 text-sm"><Link className="underline" href={`/events/${selected.slug}`}>Event details</Link></p>
    </div>
  );
}
