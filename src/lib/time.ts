export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(timeZone: string) {
  return isValidTimeZone(timeZone) ? timeZone : "UTC";
}

function part(parts: Intl.DateTimeFormatPart[], type: string) {
  const value = parts.find((item) => item.type === type)?.value ?? "0";
  return Number(value === "24" ? "0" : value);
}

function wallClockAsUtc(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  return Date.UTC(part(parts, "year"), part(parts, "month") - 1, part(parts, "day"), part(parts, "hour"), part(parts, "minute"), part(parts, "second"));
}

export function zonedInputToUtc(value: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match || !isValidTimeZone(timeZone)) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = wallClockAsUtc(new Date(desired), timeZone) - desired;
  const corrected = desired - firstOffset;
  const secondOffset = wallClockAsUtc(new Date(corrected), timeZone) - corrected;
  return new Date(desired - secondOffset);
}

export function utcToZonedInput(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const zone = safeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => {
    const value = parts.find((item) => item.type === type)?.value ?? "";
    return value === "24" ? "00" : value;
  };
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
}

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeTimeZone(timeZone),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatTimeRange(startIso: string, endIso: string, timeZone: string) {
  return `${formatTime(startIso, timeZone)}–${formatTime(endIso, timeZone)}`;
}

export function formatDayLabel(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeTimeZone(timeZone),
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function dayKey(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function formatDateRange(startIso: string | null, endIso: string | null, timeZone: string) {
  if (!startIso) return "";
  const zone = safeTimeZone(timeZone);
  const startLabel = formatDayLabel(startIso, zone);
  if (!endIso || dayKey(startIso, zone) === dayKey(endIso, zone)) return startLabel;
  return `${startLabel} – ${formatDayLabel(endIso, zone)}`;
}
