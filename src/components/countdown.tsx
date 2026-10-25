"use client";

import { useEffect, useState } from "react";
import { getCountdownState, presentCountdown } from "@/lib/countdown";

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-4 text-center ring-1 ring-white/10">
      <div className="font-display text-3xl font-semibold text-white sm:text-4xl" aria-hidden="true">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-mist">{label}</div>
    </div>
  );
}

export function Countdown({
  startAt,
  endAt,
  datesConfirmed,
  nextEventUrl,
  nextEventLabel,
}: {
  startAt: string | null;
  endAt: string | null;
  datesConfirmed: boolean;
  nextEventUrl: string;
  nextEventLabel: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!startAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startAt]);

  const presentation = presentCountdown(
    now === null ? { phase: startAt ? "upcoming" : "unconfigured", days: 0, hours: 0, minutes: 0, seconds: 0 } : getCountdownState(now, startAt, endAt),
    datesConfirmed,
  );
  const waiting = now === null && startAt;

  return (
    <section className="rounded-3xl bg-ink/80 p-6 ring-1 ring-white/10 backdrop-blur" aria-label="Event countdown">
      {presentation.mode === "unset" ? (
        <div>
          <h2 className="font-display text-2xl text-white">Date to be announced</h2>
          <p className="mt-3 leading-7 text-mist">The event date has not been set, so there is no countdown yet.</p>
        </div>
      ) : null}
      {presentation.mode === "invalid" ? (
        <div>
          <h2 className="font-display text-2xl text-white">Date needs attention</h2>
          <p className="mt-3 leading-7 text-mist">The saved event date could not be read. Update it in the admin dashboard.</p>
        </div>
      ) : null}
      {presentation.mode === "placeholder-past" ? (
        <div>
          <h2 className="font-display text-2xl text-white">Placeholder date has passed</h2>
          <p className="mt-3 leading-7 text-mist">This is not a confirmed live or ended state. Set a confirmed date before treating the summit as underway.</p>
        </div>
      ) : null}
      {presentation.mode === "live" ? (
        <div>
          <h2 className="font-display text-2xl text-white">The summit is in progress</h2>
          <p className="mt-3 leading-7 text-mist">The confirmed event has started.</p>
        </div>
      ) : null}
      {presentation.mode === "ended" ? (
        <div>
          <h2 className="font-display text-2xl text-white">This summit has ended</h2>
          <p className="mt-3 leading-7 text-mist">The confirmed event dates are in the past.</p>
          {nextEventUrl ? (
            <a className="mt-4 inline-flex text-sm font-semibold text-lavender" href={nextEventUrl}>
              {nextEventLabel || "View the next announcement"}
            </a>
          ) : (
            <p className="mt-3 text-sm text-mist">Details of a future event will be posted when the organizer announces one.</p>
          )}
        </div>
      ) : null}
      {presentation.mode === "preview" || presentation.mode === "upcoming" ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lavender">
            {presentation.mode === "preview" ? "Countdown preview" : "Countdown"}
          </p>
          <h2 className="mt-2 font-display text-2xl text-white">
            {presentation.mode === "preview" ? "Placeholder date" : "Until the summit begins"}
          </h2>
          {presentation.mode === "preview" ? (
            <p className="mt-3 text-sm leading-6 text-mist">
              These numbers use an unconfirmed placeholder so the timer can be demonstrated. They are not a confirmed schedule.
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-4 gap-2" aria-live="off">
            <Unit value={waiting ? "—" : String(presentation.days)} label="Days" />
            <Unit value={waiting ? "—" : String(presentation.hours).padStart(2, "0")} label="Hours" />
            <Unit value={waiting ? "—" : String(presentation.minutes).padStart(2, "0")} label="Minutes" />
            <Unit value={waiting ? "—" : String(presentation.seconds).padStart(2, "0")} label="Seconds" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
