import { describe, expect, it } from "vitest";

import { areaAt, isInExcludedArea } from "./areas";
import type { MalmoEvent } from "./types";

function at(venue: MalmoEvent["venue"]): MalmoEvent {
  return {
    id: "test:1",
    sourceId: "test",
    title: "Test",
    startsAt: "2026-10-24T18:00:00.000Z",
    category: "other",
    isFree: true,
    url: "https://example.com",
    venue,
  };
}

describe("isInExcludedArea", () => {
  it("drops venues inside Rosengård by coordinates", () => {
    expect(isInExcludedArea(at({ name: "Rosengård centrum", lat: 55.5835, lng: 13.0445 }))).toBe(true);
    expect(isInExcludedArea(at({ name: "Somewhere", lat: 55.5852, lng: 13.0446 }))).toBe(true);
  });

  it("drops venues named or addressed in Rosengård without coordinates", () => {
    expect(isInExcludedArea(at({ name: "Rosengårdsbiblioteket" }))).toBe(true);
    expect(isInExcludedArea(at({ name: "Hall", address: "Ramels väg 1, Rosengård" }))).toBe(true);
  });

  it("keeps nearby venues outside Rosengård", () => {
    expect(isInExcludedArea(at({ name: "Plan B", lat: 55.5839, lng: 13.0272 }))).toBe(false);
    expect(isInExcludedArea(at({ name: "Garaget", lat: 55.5888, lng: 13.0207 }))).toBe(false);
    expect(isInExcludedArea(at({ name: "Arena 305", lat: 55.5849, lng: 13.0177 }))).toBe(false);
    expect(isInExcludedArea(at({ name: "Husiebiblioteket", lat: 55.5909, lng: 13.0709 }))).toBe(false);
    expect(isInExcludedArea(at(undefined))).toBe(false);
  });
});

describe("areaAt", () => {
  it("places Värnhem in its own area", () => {
    expect(areaAt(55.6035, 13.0235)).toBe("varnhem");
  });
});
