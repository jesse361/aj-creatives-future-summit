import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { EmptyState, PageHero } from "@/components/ui";
import { listEvents } from "@/lib/queries";
import { inputClass } from "@/lib/styles";

export const metadata: Metadata = {
  title: "Events",
  description: "Search published WHY US conferences, summits, workshops, and gatherings.",
};

type Search = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function EventsPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <>
      <PageHero eyebrow="Discover" title="Events" description="Search the published programme by name, category, date, place, and format." />
      <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-12 text-ink-soft">Loading events…</p>}>
        <EventResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EventResults({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const filters = {
    q: one(params.q),
    category: one(params.category),
    format: one(params.format),
    city: one(params.city),
    when: one(params.when) || "upcoming",
    sort: one(params.sort) || "soonest",
    page: Number(one(params.page) || "1"),
  };
  const result = await listEvents(filters);
  const query = (page: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (!value || key === "page" || (key === "when" && value === "upcoming") || (key === "sort" && value === "soonest")) continue;
      next.set(key, String(value));
    }
    if (page > 1) next.set("page", String(page));
    const text = next.toString();
    return text ? `/events?${text}` : "/events";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <form className="grid gap-3 border border-line bg-white p-4 md:grid-cols-6" action="/events">
        <label className="md:col-span-2 text-sm">
          Search
          <input className={inputClass} name="q" defaultValue={filters.q} placeholder="Title or description" />
        </label>
        <label className="text-sm">
          Category
          <select className={inputClass} name="category" defaultValue={filters.category}>
            <option value="">All</option>
            {result.categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Format
          <select className={inputClass} name="format" defaultValue={filters.format}>
            <option value="">All</option>
            <option value="IN_PERSON">In person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
        <label className="text-sm">
          City
          <select className={inputClass} name="city" defaultValue={filters.city}>
            <option value="">All</option>
            {result.cities.map((city) => <option key={city}>{city}</option>)}
          </select>
        </label>
        <label className="text-sm">
          When
          <select className={inputClass} name="when" defaultValue={filters.when}>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>
        <label className="text-sm">
          Sort
          <select className={inputClass} name="sort" defaultValue={filters.sort}>
            <option value="soonest">Soonest</option>
            <option value="latest">Latest</option>
            <option value="title">Title</option>
          </select>
        </label>
        <div className="flex items-end gap-3 md:col-span-6">
          <button className="min-h-11 bg-navy px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white">Apply</button>
          <Link className="text-sm text-electric" href="/events">Clear filters</Link>
        </div>
      </form>
      {result.events.length ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {result.events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No events match" body="Try another search, or clear the filters. Only published events are listed." action={{ href: "/events", label: "Clear filters" }} />
        </div>
      )}
      {result.pages > 1 ? (
        <nav className="mt-8 flex gap-4 text-sm" aria-label="Pagination">
          {result.page > 1 ? <Link href={query(result.page - 1)}>Previous</Link> : null}
          <span>Page {result.page} of {result.pages}</span>
          {result.page < result.pages ? <Link href={query(result.page + 1)}>Next</Link> : null}
        </nav>
      ) : null}
    </div>
  );
}
