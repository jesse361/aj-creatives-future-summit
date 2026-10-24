"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterSessions, groupSessionsByDay } from "@/lib/schedule";
import type { SiteData } from "@/lib/event-data";

type Session = SiteData["sessions"][number];

export function ScheduleBoard({ sessions, timezone }: { sessions: Session[]; timezone: string }) {
  const days = useMemo(() => {
    const seen = new Map<string, string>();
    sessions.forEach((session) => {
      if (!seen.has(session.dayKey)) seen.set(session.dayKey, session.dayLabel);
    });
    return [...seen.entries()].map(([dayKey, dayLabel]) => ({ dayKey, dayLabel }));
  }, [sessions]);
  const categories = useMemo(() => [...new Set(sessions.map((session) => session.category))], [sessions]);
  const [day, setDay] = useState(days[0]?.dayKey ?? "");
  const [category, setCategory] = useState("");
  const filtered = filterSessions(sessions, day, category);
  const groups = groupSessionsByDay(filtered);

  if (sessions.length === 0) {
    return (
      <div className="surface-card p-10">
        <h2 className="text-3xl">Schedule coming soon</h2>
        <p className="mt-3 max-w-xl text-muted">
          The agenda has not been published. Session times will appear here after the organizer adds them.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted">Times shown in {timezone}.</p>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Event day">
          {days.map((item) => (
            <button
              key={item.dayKey}
              type="button"
              aria-pressed={day === item.dayKey}
              onClick={() => setDay(item.dayKey)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${day === item.dayKey ? "bg-navy text-white" : "bg-white ring-1 ring-line"}`}
            >
              {item.dayLabel}
            </button>
          ))}
        </div>
        <label className="field lg:w-64">
          <span className="sr-only">Session category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Session category">
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {groups.length === 0 ? (
        <p className="surface-card mt-6 p-8 text-muted">No sessions match those filters.</p>
      ) : (
        groups.map((group) => (
          <div key={group.dayKey} className="mt-8">
            <h2 className="text-2xl">{group.dayLabel}</h2>
            <ol className="mt-5 space-y-4 border-l border-line pl-6">
              {group.sessions.map((session) => (
                <li key={session.id} className="relative">
                  <span
                    className={`absolute -left-[1.95rem] top-5 h-3 w-3 rounded-full ${session.isBreak ? "bg-white ring-2 ring-lavender" : "bg-electric"}`}
                    aria-hidden
                  />
                  <article className={`rounded-2xl p-5 ${session.isBreak ? "bg-paper ring-1 ring-line" : "surface-card"}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
                      <time dateTime={session.startAt}>{session.timeLabel}</time>
                      <span>· {session.category}</span>
                      <span>· {session.room}</span>
                      {session.isSample ? <span className="text-action">Sample session</span> : null}
                    </div>
                    <h3 className="mt-2 text-2xl">{session.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{session.description}</p>
                    {session.speakers.length ? (
                      <p className="mt-3 text-sm">
                        {session.speakers.map((speaker, index) => (
                          <span key={speaker.slug}>
                            {index > 0 ? ", " : ""}
                            <Link href={`/speakers/${speaker.slug}`} className="font-semibold text-action">
                              {speaker.name}
                            </Link>
                            {speaker.role === "moderator" ? " (moderator)" : ""}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          </div>
        ))
      )}
    </div>
  );
}
