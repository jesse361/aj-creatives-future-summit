export type CountdownState =
  | { phase: "unconfigured" }
  | { phase: "invalid" }
  | { phase: "upcoming"; days: number; hours: number; minutes: number; seconds: number }
  | { phase: "live" }
  | { phase: "ended" };

export function getCountdownState(nowMs: number, startIso: string | null, endIso: string | null): CountdownState {
  if (!startIso) return { phase: "unconfigured" };
  const start = new Date(startIso).getTime();
  if (!Number.isFinite(start)) return { phase: "invalid" };

  let end = Number.NaN;
  if (endIso) {
    end = new Date(endIso).getTime();
    if (!Number.isFinite(end) || end <= start) return { phase: "invalid" };
  }

  if (nowMs < start) {
    let delta = Math.floor((start - nowMs) / 1000);
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;
    const hours = Math.floor(delta / 3600);
    delta -= hours * 3600;
    const minutes = Math.floor(delta / 60);
    const seconds = delta - minutes * 60;
    return { phase: "upcoming", days, hours, minutes, seconds };
  }

  if (!endIso || nowMs < end) return { phase: "live" };
  return { phase: "ended" };
}

export type CountdownPresentation =
  | { mode: "unset" }
  | { mode: "invalid" }
  | { mode: "preview"; days: number; hours: number; minutes: number; seconds: number }
  | { mode: "upcoming"; days: number; hours: number; minutes: number; seconds: number }
  | { mode: "live" }
  | { mode: "ended" }
  | { mode: "placeholder-past" };

export function presentCountdown(state: CountdownState, datesConfirmed: boolean): CountdownPresentation {
  if (state.phase === "unconfigured") return { mode: "unset" };
  if (state.phase === "invalid") return { mode: "invalid" };
  if (!datesConfirmed && (state.phase === "live" || state.phase === "ended")) {
    return { mode: "placeholder-past" };
  }
  if (!datesConfirmed && state.phase === "upcoming") {
    return { mode: "preview", days: state.days, hours: state.hours, minutes: state.minutes, seconds: state.seconds };
  }
  if (state.phase === "upcoming") {
    return { mode: "upcoming", days: state.days, hours: state.hours, minutes: state.minutes, seconds: state.seconds };
  }
  return { mode: state.phase };
}
