"use client";

import { useMemo, useState } from "react";
import { groupSessionsByDay } from "@/lib/schedule";
import { formatTimeRange } from "@/lib/time";
import type { PublicSession } from "@/lib/types";

export function ScheduleBoard({
  sessions,
  timeZone,
  timezoneConfirmed,
  datesConfirmed,
}: {
  sessions: PublicSession[];
  timeZone: string;
  timezoneConfirmed: boolean;
  datesConfirmed: boolean;
}) {
  const groups = useMemo(() => groupSessionsByDay(sessions, timeZone), [sessions, timeZone]);
  const [day, setDay] = useState("All");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(sessions.map((session) => session.category))];
  const visible = groups
    .filter((group) => day === "All" || group.key === day)
    .map((group) => ({
      ...group,
      sessions: group.sessions.filter((session) => category === "All" || session.category === category),
    }))
    .filter((group) => group.sessions.length > 0);

  if (sessions.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-line bg-white p-8 leading-7">
        The schedule has not been published yet. Session times will appear here once the organizer adds them.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate">
        {timezoneConfirmed ? `Times shown in ${timeZone}.` : "Times shown in UTC because the event timezone is not confirmed."}
        {datesConfirmed ? "" : " Dates below are placeholders."}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-navy">
          Day
          <select className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3" value={day} onChange={(event) => setDay(event.target.value)}>
            <option value="All">All days</option>
            {groups.map((group, index) => (
              <option key={group.key} value={group.key}>
                Day {index + 1}
                {datesConfirmed ? ` · ${group.label}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">
          Category
          <select className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? <p className="mt-8 rounded-3xl bg-white p-8">No sessions match those filters.</p> : null}
      <div className="mt-8 space-y-10">
        {visible.map((group) => {
          const dayNumber = groups.findIndex((item) => item.key === group.key) + 1;
          return (
          <section key={group.key}>
            <h2 className="font-display text-2xl text-navy">
              Day {dayNumber}
              <span className="mt-1 block text-base font-normal text-slate">{datesConfirmed ? group.label : `Placeholder day ${dayNumber}`}</span>
            </h2>
            <ol className="mt-5 space-y-3">
              {group.sessions.map((session) => (
                <li key={session.id} className={`rounded-3xl border p-5 ${session.isBreak ? "border-line bg-paper" : "border-line bg-white"}`}>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <time className="font-semibold text-navy" dateTime={session.startAt}>
                      {formatTimeRange(session.startAt, session.endAt, timeZone)}
                    </time>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.isBreak ? "bg-white text-slate" : "bg-electric/10 text-electric-deep"}`}>
                      {session.category}
                    </span>
                    {session.isSample ? <span className="text-xs font-semibold text-slate">Sample</span> : null}
                  </div>
                  <h3 className="mt-3 font-display text-xl text-navy">{session.title}</h3>
                  {session.description ? <p className="mt-2 leading-7 text-slate">{session.description}</p> : null}
                  <p className="mt-3 text-sm text-slate">
                    {session.speakers.length
                      ? session.speakers.map((speaker) => `${speaker.name}${speaker.role === "MODERATOR" ? " (moderator)" : ""}`).join(", ")
                      : session.isBreak
                        ? "Break"
                        : "Speaker to be announced"}
                    {session.room ? ` · ${session.room}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          );
        })}
      </div>
    </div>
  );
}
