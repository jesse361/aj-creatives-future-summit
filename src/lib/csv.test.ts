import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("quotes cells and neutralizes spreadsheet formulas", () => {
    const csv = toCsv(["Name", "Note"], [["Ada", '=HYPERLINK("http://example.test")'], ["Sam", 'He said "hello"']]);
    expect(csv).toContain(`"'=HYPERLINK(""http://example.test"")"`);
    expect(csv).toContain(`"He said ""hello"""`);
  });
});
