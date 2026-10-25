import { describe, expect, it } from "vitest";
import { utcToZonedInput, zonedInputToUtc } from "@/lib/time";

describe("timezone conversion", () => {
  it("keeps UTC wall-clock times unchanged", () => {
    const date = zonedInputToUtc("2027-10-15T09:00", "UTC");
    expect(date?.toISOString()).toBe("2027-10-15T09:00:00.000Z");
    expect(utcToZonedInput("2027-10-15T09:00:00.000Z", "UTC")).toBe("2027-10-15T09:00");
  });

  it("converts a New York wall-clock time to UTC", () => {
    const date = zonedInputToUtc("2027-10-15T09:00", "America/New_York");
    expect(date?.toISOString()).toBe("2027-10-15T13:00:00.000Z");
    expect(utcToZonedInput("2027-10-15T13:00:00.000Z", "America/New_York")).toBe("2027-10-15T09:00");
  });

  it("rejects malformed input", () => {
    expect(zonedInputToUtc("15 Oct 2027", "UTC")).toBeNull();
    expect(zonedInputToUtc("2027-10-15T09:00", "Not/AZone")).toBeNull();
  });
});
