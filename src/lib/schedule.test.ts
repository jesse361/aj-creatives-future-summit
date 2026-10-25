import { describe, expect, it } from "vitest";
import { groupSessionsByDay, isValidSession, sessionsOverlap } from "@/lib/schedule";
import type { PublicSession } from "@/lib/types";

const base = {
  description: "",
  room: "Room A",
  category: "Keynote",
  isBreak: false,
  isSample: true,
  speakers: [],
};

function session(id: string, startAt: string, endAt: string, room = "Room A"): PublicSession {
  return { ...base, id, title: id, startAt, endAt, room };
}

describe("schedule", () => {
  it("rejects an end time that is not after the start", () => {
    expect(isValidSession({ startAt: "2027-10-15T10:00:00.000Z", endAt: "2027-10-15T10:00:00.000Z" })).toBe(false);
    expect(isValidSession({ startAt: "2027-10-15T10:00:00.000Z", endAt: "2027-10-15T11:00:00.000Z" })).toBe(true);
  });

  it("detects overlap only in the same room", () => {
    const candidate = {
      startAt: new Date("2027-10-15T10:00:00.000Z"),
      endAt: new Date("2027-10-15T11:00:00.000Z"),
      room: "Room A",
    };
    expect(
      sessionsOverlap(candidate, [
        { id: "1", startAt: new Date("2027-10-15T10:30:00.000Z"), endAt: new Date("2027-10-15T11:30:00.000Z"), room: "Room A" },
      ])?.id,
    ).toBe("1");
    expect(
      sessionsOverlap(candidate, [
        { id: "2", startAt: new Date("2027-10-15T10:30:00.000Z"), endAt: new Date("2027-10-15T11:30:00.000Z"), room: "Room B" },
      ]),
    ).toBeUndefined();
    expect(
      sessionsOverlap(candidate, [
        { id: "3", startAt: new Date("2027-10-15T11:00:00.000Z"), endAt: new Date("2027-10-15T12:00:00.000Z"), room: "Room A" },
      ]),
    ).toBeUndefined();
  });

  it("groups a multi-day agenda in chronological order", () => {
    const groups = groupSessionsByDay(
      [
        session("late", "2027-10-16T09:00:00.000Z", "2027-10-16T10:00:00.000Z"),
        session("early", "2027-10-15T09:00:00.000Z", "2027-10-15T10:00:00.000Z"),
        session("mid", "2027-10-15T11:00:00.000Z", "2027-10-15T12:00:00.000Z"),
        session("bad", "2027-10-15T12:00:00.000Z", "2027-10-15T11:00:00.000Z"),
      ],
      "UTC",
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]?.sessions.map((item) => item.id)).toEqual(["early", "mid"]);
    expect(groups[1]?.sessions.map((item) => item.id)).toEqual(["late"]);
  });
});
