import { describe, expect, it } from "vitest";
import { getCountdownState, presentCountdown } from "@/lib/countdown";

const start = "2027-10-15T08:30:00.000Z";
const end = "2027-10-16T15:15:00.000Z";

describe("getCountdownState", () => {
  it("treats a missing date as unconfigured", () => {
    expect(getCountdownState(Date.now(), null, null).phase).toBe("unconfigured");
    expect(getCountdownState(Date.now(), "", null).phase).toBe("unconfigured");
  });

  it("rejects dates that cannot be read", () => {
    expect(getCountdownState(Date.now(), "soon", null).phase).toBe("invalid");
    expect(getCountdownState(Date.now(), start, "later").phase).toBe("invalid");
    expect(getCountdownState(Date.now(), end, start).phase).toBe("invalid");
  });

  it("splits the remaining time into days, hours, minutes, and seconds", () => {
    const now = new Date(start).getTime() - ((1 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000);
    expect(getCountdownState(now, start, end)).toEqual({
      phase: "upcoming",
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it("moves from upcoming to live to ended", () => {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    expect(getCountdownState(startMs - 1000, start, end).phase).toBe("upcoming");
    expect(getCountdownState(startMs, start, end).phase).toBe("live");
    expect(getCountdownState(startMs + 1000, start, null).phase).toBe("live");
    expect(getCountdownState(endMs - 1, start, end).phase).toBe("live");
    expect(getCountdownState(endMs, start, end).phase).toBe("ended");
  });
});

describe("presentCountdown", () => {
  it("does not present an unconfirmed past placeholder as a live event", () => {
    const state = getCountdownState(new Date(end).getTime() + 1000, start, end);
    expect(presentCountdown(state, false).mode).toBe("placeholder-past");
    expect(presentCountdown(state, true).mode).toBe("ended");
  });

  it("labels an unconfirmed future date as a preview", () => {
    const state = getCountdownState(new Date(start).getTime() - 5000, start, end);
    expect(presentCountdown(state, false).mode).toBe("preview");
    expect(presentCountdown(state, true).mode).toBe("upcoming");
  });
});
