import { describe, expect, it } from "vitest";

import { EVENT_CATEGORIES, type MalmoEvent } from "@/lib/events/types";

import { VENUES } from "./venues";

/** Calls the real venue sites, so it only runs with BENCH_LIVE=1. */
const live = process.env.BENCH_LIVE === "1";

function expectValid(events: MalmoEvent[], sourceId: string) {
  expect(events.length).toBeGreaterThan(0);
  for (const e of events) {
    expect(e.id.startsWith(`${sourceId}:`)).toBe(true);
    expect(e.title).not.toBe("");
    expect(Number.isNaN(Date.parse(e.startsAt))).toBe(false);
    expect(EVENT_CATEGORIES).toContain(e.category);
    expect(e.url).toMatch(/^https:\/\//);
  }
  expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
}

describe.runIf(live)("live: current adapter and OpenWeb against the same venue", () => {
  describe.each(VENUES.map((v) => [v.id, v] as const))("%s", (_, venue) => {
    let current: MalmoEvent[] = [];
    let openweb: MalmoEvent[] = [];

    it("current adapter returns valid events", async () => {
      current = await venue.current.fetchEvents({ warn: () => {} });
      expectValid(current, venue.current.id);
    }, 30_000);

    it("OpenWeb returns valid events", async () => {
      openweb = await venue.openweb();
      expectValid(openweb, venue.current.id);
    }, 60_000);

    it("OpenWeb finds at least the events the adapter finds", () => {
      const found = new Set(openweb.map((e) => e.id));
      const missing = current.filter((e) => !found.has(e.id)).map((e) => e.title);
      expect(missing).toEqual([]);
    });
  });
});
