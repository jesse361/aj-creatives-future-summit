"use client";

import { useEffect, useState } from "react";
import { getCountdownState } from "@/lib/countdown";

export function Countdown({ startAt, endAt }: { startAt: string; endAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const kick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(timer);
    };
  }, []);
  if (now == null) return <p className="text-sm text-mist">Loading the countdown.</p>;
  const state = getCountdownState(now, startAt, endAt);
  if (state.phase === "upcoming") {
    const parts = [
      ["Days", state.days],
      ["Hours", state.hours],
      ["Minutes", state.minutes],
      ["Seconds", state.seconds],
    ];
    return (
      <div className="grid grid-cols-4 gap-2" aria-live="polite">
        {parts.map(([label, value]) => (
          <div key={String(label)} className="border border-white/15 px-2 py-3 text-center">
            <div className="font-display text-2xl">{value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-mist">{label}</div>
          </div>
        ))}
      </div>
    );
  }
  if (state.phase === "live") return <p className="text-gold">This event is in progress.</p>;
  if (state.phase === "ended") return <p className="text-mist">This event has ended.</p>;
  return null;
}
