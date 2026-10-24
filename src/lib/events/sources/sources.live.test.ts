import { describe, expect, it } from "vitest";

import { EVENT_CATEGORIES, type MalmoEvent } from "../types";
import { hypnos } from "./hypnos";
import { malmoArena } from "./malmo-arena";
import { medley } from "./medley";
import { panora } from "./panora";
import { spegeln } from "./spegeln";

/**
 * Runs adapters against the real sites, so only with BENCH_LIVE=1
 * (`npm run test:live`). Limited to adapters that don't use the Next.js
 * page cache (`fetchDetailPage`), which only works inside the app.
 */
const LIVE_SOURCES = [spegeln, panora, medley, malmoArena, hypnos];

function expectValid(events: MalmoEvent[], sourceId: string) {
  expect(events.length).toBeGreaterThan(0);
  for (const e of events) {
    expect(e.id.startsWith(`${sourceId}:`)).toBe(true);
    expect(e.title).not.toBe("");
    expect(Number.isNaN(Date.parse(e.startsAt))).toBe(false);
    expect(EVENT_CATEGORIES).toContain(e.category);
    expect(e.url).toMatch(/^https:\/\//);
    expect(e.venue?.lat).toBeTypeOf("number");
  }
  expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
}

describe.runIf(process.env.BENCH_LIVE === "1")("live sources", () => {
  it.each(LIVE_SOURCES.map((s) => [s.id, s] as const))(
    "%s returns valid events",
    async (id, source) => {
      const warnings: string[] = [];
      const events = await source.fetchEvents({ warn: (m) => warnings.push(m) });
      expectValid(events, id);
      expect(warnings).toEqual([]);
    },
    30_000,
  );
});
