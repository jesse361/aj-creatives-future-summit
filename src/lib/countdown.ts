export type CountdownState =
  | { phase: "unconfigured" }
  | { phase: "invalid" }
  | { phase: "upcoming"; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "live" }
  | { phase: "ended" };

export function getCountdownState(nowMs: number, startIso: string | null, endIso: string | null): CountdownState {
  if (!startIso) return { phase: "unconfigured" };
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return { phase: "invalid" };

  let end: number | null = null;
  if (endIso) {
    end = new Date(endIso).getTime();
    if (Number.isNaN(end) || end <= start) return { phase: "invalid" };
  }

  if (nowMs >= start) {
    if (end !== null && nowMs > end) return { phase: "ended" };
    return { phase: "live" };
  }

  const totalSeconds = Math.floor((start - nowMs) / 1000);
  return {
    phase: "upcoming",
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
