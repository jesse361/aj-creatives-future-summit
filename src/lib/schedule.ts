export type ScheduleWindow = {
  id?: string;
  room?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  title?: string;
};

function time(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function validateSessionWindow(startAt: Date, endAt: Date) {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return "Enter a valid start and end time.";
  }
  if (endAt <= startAt) return "The end time must be after the start time.";
  return null;
}

export function sortSessions<T extends { startAt: Date | string; sortOrder?: number }>(sessions: T[]) {
  return [...sessions].sort((a, b) => {
    const delta = time(a.startAt) - time(b.startAt);
    if (delta !== 0) return delta;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function roomKey(room?: string | null) {
  const value = room?.trim();
  return value ? value : "Unassigned";
}

export function sessionsOverlap(a: ScheduleWindow, b: ScheduleWindow) {
  return time(a.startAt) < time(b.endAt) && time(b.startAt) < time(a.endAt);
}

export function findRoomOverlap<T extends ScheduleWindow>(candidate: ScheduleWindow, sessions: T[]) {
  const candidateRoom = roomKey(candidate.room);
  return (
    sessions.find((session) => {
      if (candidate.id && session.id === candidate.id) return false;
      if (roomKey(session.room) !== candidateRoom) return false;
      return sessionsOverlap(candidate, session);
    }) ?? null
  );
}

export function filterSessions<T extends { dayKey: string; category: string }>(
  sessions: T[],
  dayKey: string,
  category: string,
) {
  return sessions.filter((session) => {
    if (dayKey && session.dayKey !== dayKey) return false;
    if (category && session.category !== category) return false;
    return true;
  });
}

export function groupSessionsByDay<T extends { dayKey: string; dayLabel: string }>(sessions: T[]) {
  const groups: { dayKey: string; dayLabel: string; sessions: T[] }[] = [];
  for (const session of sessions) {
    const current = groups[groups.length - 1];
    if (!current || current.dayKey !== session.dayKey) {
      groups.push({ dayKey: session.dayKey, dayLabel: session.dayLabel, sessions: [session] });
    } else {
      current.sessions.push(session);
    }
  }
  return groups;
}
