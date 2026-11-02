import { describe, expect, it } from "vitest";

import { parseSwedishDate } from "./scrape";

describe("parseSwedishDate", () => {
  it("reads the day, month, year and time from listing text", () => {
    expect(parseSwedishDate("fre 9 okt 2026 19.00")).toMatchObject({ ymd: "2026-10-09", time: "19:00" });
    expect(parseSwedishDate("30 november 2026 | 18:30")).toMatchObject({ ymd: "2026-11-30", time: "18:30" });
  });

  it("rejects days the month doesn't have instead of rolling into the next month", () => {
    expect(parseSwedishDate("31 nov 2026")).toBeUndefined();
    expect(parseSwedishDate("31 nov", "2026-11-02")).toBeUndefined();
    expect(parseSwedishDate("30 nov", "2026-11-02")).toMatchObject({ ymd: "2026-11-30" });
  });

  it("knows leap years", () => {
    expect(parseSwedishDate("29 feb 2028")).toMatchObject({ ymd: "2028-02-29" });
    expect(parseSwedishDate("29 feb 2027")).toBeUndefined();
  });
});
