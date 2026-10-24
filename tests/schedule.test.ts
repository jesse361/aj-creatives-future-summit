import { describe, expect, it } from "vitest";
import { findRoomOverlap, filterSessions, groupSessionsByDay, sortSessions, validateSessionWindow } from "@/lib/schedule";
import { toDateTimeLocalValue, zonedTimeToUtc } from "@/lib/time";

describe("schedule", () => {
  it("sorts sessions by start time", () => {
    const sorted = sortSessions([
      { title: "Later", startAt: "2027-06-15T11:00:00.000Z", sortOrder: 0 },
      { title: "Earlier", startAt: "2027-06-15T09:00:00.000Z", sortOrder: 2 },
    ]);
    expect(sorted.map((session) => session.title)).toEqual(["Earlier", "Later"]);
  });

  it("rejects an end time that is not after the start", () => {
    const start = new Date("2027-06-15T10:00:00.000Z");
    expect(validateSessionWindow(start, start)).toMatch(/after/i);
    expect(validateSessionWindow(start, new Date("2027-06-15T11:00:00.000Z"))).toBeNull();
  });

  it("blocks overlaps in the same room and allows a different room", () => {
    const existing = [{ id: "a", title: "Panel", room: "Main Hall", startAt: "2027-06-15T10:00:00.000Z", endAt: "2027-06-15T11:00:00.000Z" }];
    expect(findRoomOverlap({ room: "Main Hall", startAt: "2027-06-15T10:30:00.000Z", endAt: "2027-06-15T11:30:00.000Z" }, existing)?.title).toBe("Panel");
    expect(findRoomOverlap({ room: "Studio A", startAt: "2027-06-15T10:30:00.000Z", endAt: "2027-06-15T11:30:00.000Z" }, existing)).toBeNull();
  });

  it("filters by day and category and groups a multi-day agenda", () => {
    const sessions = [
      { dayKey: "2027-06-15", dayLabel: "Tue 15 Jun 2027", category: "Keynote", title: "Open" },
      { dayKey: "2027-06-15", dayLabel: "Tue 15 Jun 2027", category: "Break", title: "Coffee" },
      { dayKey: "2027-06-16", dayLabel: "Wed 16 Jun 2027", category: "Keynote", title: "Close" },
    ];
    expect(filterSessions(sessions, "2027-06-16", "").map((session) => session.title)).toEqual(["Close"]);
    expect(filterSessions(sessions, "2027-06-15", "Break").map((session) => session.title)).toEqual(["Coffee"]);
    expect(groupSessionsByDay(sessions)).toHaveLength(2);
  });
});

describe("time zones", () => {
  it("round-trips a zoned time", () => {
    const date = new Date("2027-06-15T13:00:00.000Z");
    const local = toDateTimeLocalValue(date, "America/New_York");
    expect(zonedTimeToUtc(local, "America/New_York")?.toISOString()).toBe(date.toISOString());
  });
});
