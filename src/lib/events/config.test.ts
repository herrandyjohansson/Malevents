import { describe, expect, it } from "vitest";

import { parseIdList } from "./config";

describe("parseIdList (EVENTS_DISABLED_SOURCES)", () => {
  it("is empty when the variable is unset or blank", () => {
    expect(parseIdList(undefined)).toEqual([]);
    expect(parseIdList("")).toEqual([]);
    expect(parseIdList(" , ")).toEqual([]);
  });

  it("splits on commas and spaces, as typed into Vercel", () => {
    expect(parseIdList("malmo-stad,hypnos")).toEqual(["malmo-stad", "hypnos"]);
    expect(parseIdList(" malmo-stad, hypnos ,spegeln ")).toEqual(["malmo-stad", "hypnos", "spegeln"]);
    expect(parseIdList("malmo-stad hypnos")).toEqual(["malmo-stad", "hypnos"]);
  });

  it("drops repeats", () => {
    expect(parseIdList("hypnos,hypnos")).toEqual(["hypnos"]);
  });
});
