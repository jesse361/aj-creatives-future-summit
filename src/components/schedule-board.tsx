import Link from "next/link";
import type { PublicSession } from "@/lib/types";
import { formatTimeRange } from "@/lib/time";

export function ScheduleBoard({
  sessions,
  timeZone,
  activeDay,
  eventSlug,
}: {
  sessions: PublicSession[];
  timeZone: string;
  activeDay?: string;
  eventSlug?: string;
}) {
  const grouped = new Map<string, PublicSession[]>();
  for (const session of sessions) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(session.startAt));
    grouped.set(key, [...(grouped.get(key) ?? []), session]);
  }
  const keys = [...grouped.keys()];
  const selected = activeDay && grouped.has(activeDay) ? activeDay : keys[0];
  const visible = selected ? grouped.get(selected) ?? [] : [];
  if (sessions.length === 0) return <p className="text-sm text-ink-soft">The published agenda will appear here.</p>;
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Schedule days">
        {keys.map((key) => {
          const query = new URLSearchParams();
          if (eventSlug) query.set("event", eventSlug);
          query.set("day", key);
          return (
            <Link key={key} href={`?${query.toString()}`} role="tab" aria-selected={key === selected} className={`border px-4 py-2 text-xs uppercase tracking-[0.14em] ${key === selected ? "border-navy bg-navy text-white" : "border-line bg-white"}`}>
              {new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone }).format(new Date(`${key}T12:00:00Z`))}
            </Link>
          );
        })}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-mist">Times shown in {timeZone}</p>
      <ol className="mt-6 border-l border-gold">
        {visible.map((session) => (
          <li key={session.id} className="relative py-4 pl-6">
            <span className="absolute top-6 -left-1 h-2 w-2 bg-gold" aria-hidden />
            <p className="text-xs uppercase tracking-[0.14em] text-electric">
              {formatTimeRange(session.startAt, session.endAt, timeZone)}
              {session.room ? ` · ${session.room}` : ""}
            </p>
            <h3 className="mt-1 font-display text-2xl text-navy">{session.title}</h3>
            <p className="text-xs uppercase tracking-[0.14em] text-mist">{session.category}</p>
            {session.description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{session.description}</p> : null}
            {session.speakers.length ? (
              <p className="mt-2 text-sm">
                {session.speakers.map((speaker, index) => (
                  <span key={speaker.slug}>
                    {index > 0 ? ", " : ""}
                    <Link className="underline" href={`/speakers/${speaker.slug}`}>{speaker.name}</Link>
                  </span>
                ))}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
