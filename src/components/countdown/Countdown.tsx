"use client";

import { useEffect, useState } from "react";
import { getCountdownState } from "@/lib/countdown";
import { padCountdown } from "@/lib/format";

type Props = {
  startAt: string | null;
  endAt: string | null;
  timezone: string;
  datesConfirmed: boolean;
};

export function Countdown({ startAt, endAt, timezone, datesConfirmed }: Props) {
  const [now, setNow] = useState<number | null>(null);
  const startMs = startAt ? new Date(startAt).getTime() : NaN;
  const endMs = endAt ? new Date(endAt).getTime() : NaN;
  const dateInvalid = Boolean(startAt) && (Number.isNaN(startMs) || (endAt ? Number.isNaN(endMs) || endMs <= startMs : false));

  useEffect(() => {
    if (!startAt || dateInvalid) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startAt, dateInvalid]);

  const state = now === null ? null : getCountdownState(now, startAt, endAt);
  const phaseMessage =
    state?.phase === "live"
      ? "The summit is live."
      : state?.phase === "ended"
        ? "This event has ended."
        : state?.phase === "invalid"
          ? "The event date needs to be corrected."
          : state?.phase === "unconfigured"
            ? "The event date has not been set."
            : state?.phase === "upcoming"
              ? "Countdown to the configured start time."
              : "";

  return (
    <section aria-labelledby="countdown-heading" className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="countdown-heading" className="text-sm tracking-[0.16em] text-lavender">
          COUNTDOWN
        </h2>
        <p className="text-xs text-mist">
          Timezone: {timezone}
          {datesConfirmed ? "" : " · not confirmed"}
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {phaseMessage}
      </p>
      {!datesConfirmed && startAt && !dateInvalid ? (
        <p className="mt-3 text-sm text-mist">
          Demonstration countdown. This date is stored for preview and is not a confirmed event date.
        </p>
      ) : null}
      {!startAt ? (
        <p className="mt-4 text-sm leading-6 text-white">
          The event date has not been set. A live countdown will appear here once the organizer adds a start time.
        </p>
      ) : null}
      {dateInvalid ? (
        <p className="mt-4 text-sm leading-6 text-white">
          The saved event date is invalid. Update the start and end times before publishing a countdown.
        </p>
      ) : null}
      {startAt && !dateInvalid && state === null ? (
        <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden>
          {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
            <div key={label} className="rounded-2xl bg-navy/60 px-2 py-4 text-center">
              <div className="font-display text-3xl text-white tabular-nums">--</div>
              <div className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-mist">{label}</div>
            </div>
          ))}
        </div>
      ) : null}
      {state?.phase === "upcoming" ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            ["Days", padCountdown(state.days, state.days > 99 ? 3 : 2)],
            ["Hours", padCountdown(state.hours)],
            ["Minutes", padCountdown(state.minutes)],
            ["Seconds", padCountdown(state.seconds)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-navy/60 px-2 py-4 text-center">
              <div className="font-display text-3xl text-white tabular-nums md:text-4xl">{value}</div>
              <div className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-mist">{label}</div>
            </div>
          ))}
        </div>
      ) : null}
      {state?.phase === "live" ? (
        <p className="mt-4 font-display text-3xl text-white">The summit is live.</p>
      ) : null}
      {state?.phase === "ended" ? (
        <div className="mt-4">
          <p className="font-display text-3xl text-white">This summit has ended.</p>
          <p className="mt-2 text-sm text-mist">
            AJ Creatives will share details here if another gathering is announced.
          </p>
        </div>
      ) : null}
    </section>
  );
}
