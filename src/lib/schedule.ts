import type { PublicSession } from "@/lib/types";
import { dayKey, formatDayLabel } from "@/lib/time";

export function isValidSession(session: { startAt: string; endAt: string }) {
  const start = new Date(session.startAt).getTime();
  const end = new Date(session.endAt).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function sessionsOverlap(
  candidate: { startAt: Date; endAt: Date; room: string },
  others: { id?: string; startAt: Date; endAt: Date; room: string }[],
  ignoreId?: string,
) {
  const room = candidate.room.trim().toLowerCase();
  return others.find((other) => {
    if (ignoreId && other.id === ignoreId) return false;
    if ((other.room ?? "").trim().toLowerCase() !== room) return false;
    return candidate.startAt < other.endAt && other.startAt < candidate.endAt;
  });
}

export function groupSessionsByDay(sessions: PublicSession[], timeZone: string) {
  const valid = sessions.filter(isValidSession).sort((a, b) => a.startAt.localeCompare(b.startAt) || a.title.localeCompare(b.title));
  const groups: { key: string; label: string; sessions: PublicSession[] }[] = [];
  for (const session of valid) {
    const key = dayKey(session.startAt, timeZone);
    const current = groups[groups.length - 1];
    if (!current || current.key !== key) {
      groups.push({ key, label: formatDayLabel(session.startAt, timeZone), sessions: [session] });
    } else {
      current.sessions.push(session);
    }
  }
  return groups;
}
