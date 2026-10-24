export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(timeZone: string) {
  return isValidTimeZone(timeZone) ? timeZone : "UTC";
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const zone = safeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  let hour = Number(part(parts, "hour"));
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    Number(part(parts, "year")),
    Number(part(parts, "month")) - 1,
    Number(part(parts, "day")),
    hour,
    Number(part(parts, "minute")),
    Number(part(parts, "second")),
  );
  return asUtc - date.getTime();
}

export function toDateTimeLocalValue(date: Date, timeZone: string) {
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
  let hour = part(parts, "hour");
  if (hour === "24") hour = "00";
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}T${hour}:${part(parts, "minute")}`;
}

export function zonedTimeToUtc(local: string, timeZone: string) {
  if (!isValidTimeZone(timeZone)) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  let utc = utcGuess - offset;
  const corrected = getTimeZoneOffsetMs(new Date(utc), timeZone);
  if (corrected !== offset) utc = utcGuess - corrected;
  const result = new Date(utc);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function formatInZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: safeTimeZone(timeZone),
    ...options,
  }).format(date);
}

export function formatTime(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function formatDayKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

export function formatDayLabel(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatEventRange(start: Date | null, end: Date | null, timeZone: string) {
  if (!start) return null;
  const zone = safeTimeZone(timeZone);
  const startLabel = formatInZone(start, zone, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  if (!end) return `${startLabel} (${zone})`;
  const sameDay = formatDayKey(start, zone) === formatDayKey(end, zone);
  const endLabel = formatInZone(end, zone, sameDay
    ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
    : {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
  return `${startLabel} – ${endLabel} (${zone})`;
}
