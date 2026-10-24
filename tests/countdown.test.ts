import { describe, expect, it } from "vitest";
import { getCountdownState } from "@/lib/countdown";

const start = "2027-06-15T09:00:00.000Z";
const end = "2027-06-16T12:30:00.000Z";

describe("countdown", () => {
  it("does not invent a countdown when the date is missing", () => {
    expect(getCountdownState(Date.parse(start), null, null).phase).toBe("unconfigured");
  });

  it("rejects an invalid or reversed window", () => {
    expect(getCountdownState(Date.now(), "not-a-date", end).phase).toBe("invalid");
    expect(getCountdownState(Date.now(), end, start).phase).toBe("invalid");
  });

  it("counts down to a future start", () => {
    const now = Date.parse("2027-06-14T09:00:00.000Z");
    const state = getCountdownState(now, start, end);
    expect(state).toEqual({ phase: "upcoming", days: 1, hours: 0, minutes: 0, seconds: 0 });
  });

  it("updates each part from the remaining seconds", () => {
    const now = Date.parse(start) - (3 * 86400 + 4 * 3600 + 5 * 60 + 6) * 1000;
    expect(getCountdownState(now, start, end)).toMatchObject({
      phase: "upcoming",
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
    });
  });

  it("shows live during the event and ended after it", () => {
    expect(getCountdownState(Date.parse("2027-06-15T12:00:00.000Z"), start, end).phase).toBe("live");
    expect(getCountdownState(Date.parse("2027-06-16T12:30:00.000Z"), start, end).phase).toBe("live");
    expect(getCountdownState(Date.parse("2027-06-16T12:30:01.000Z"), start, end).phase).toBe("ended");
  });
});
