import { writeFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

import type { MalmoEvent } from "./types";

// Exercise the actual normalisation and merge code outside Next.js; bypass only its cache runtime.
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
const captured = vi.hoisted(() => new Map<string, MalmoEvent[]>());
vi.mock("./fetch-source", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./fetch-source")>();
  return {
    ...actual,
    fetchSource: async (id: string) => {
      const result = await actual.fetchSource(id);
      if (result.ok) captured.set(id, result.events);
      return result;
    },
  };
});

describe.runIf(process.env.DUPLICATE_AUDIT_LIVE === "1")("live duplicate measurement", () => {
  it("measures the real pipeline before and after aggregation and saves reproducible evidence", async () => {
    const path = process.env.DUPLICATE_AUDIT_OUTPUT;
    if (!path) throw new Error("Set DUPLICATE_AUDIT_OUTPUT to an explicit snapshot JSON path");
    const { getAllEvents } = await import("./aggregate");
    const { auditDuplicates } = await import("./duplicate-audit");
    const { isUpcoming } = await import("./filters");
    const started = new Date();
    const { events, sources } = await getAllEvents("complete");
    const raw = sources.filter((source) => source.state === "ok").flatMap((source) => captured.get(source.id) ?? []);
    const upcoming = events.filter((event) => isUpcoming(event, started));
    const report = {
      capturedAt: started.toISOString(),
      completedAt: new Date().toISOString(),
      sources,
      rawCount: raw.length,
      mergedCount: events.length,
      removedByAggregator: raw.length - events.length,
      rawAudit: auditDuplicates(raw.filter((event) => isUpcoming(event, started))),
      upcomingAudit: auditDuplicates(upcoming),
      events: upcoming,
      // Every listing before merging, to review what was merged into what.
      rawEvents: raw.filter((event) => isUpcoming(event, started)),
    };
    await writeFile(path, JSON.stringify(report, null, 2) + "\n");
    console.info("duplicate_audit.summary", JSON.stringify({
      path, raw: report.rawCount, merged: report.mergedCount, removed: report.removedByAggregator,
      upcoming: upcoming.length, candidatePairs: report.upcomingAudit.pairs.length,
      candidateEventRows: report.upcomingAudit.candidateEventIds.length,
      identityPairs: report.upcomingAudit.sharedLinkPairs.length,
      identityGroups: report.upcomingAudit.identityGroups.length,
      identitySupportedSurplus: report.upcomingAudit.identitySupportedSurplus,
      venuePairs: report.upcomingAudit.venuePairs.length,
      failed: sources.filter((source) => source.state === "error").map((source) => source.id),
    }));
    expect(sources.some((source) => source.state === "ok")).toBe(true);
    expect(raw.length).toBeGreaterThan(0);
    expect(report.removedByAggregator).toBeGreaterThanOrEqual(0);
    expect(report.upcomingAudit.exactIds).toEqual([]);
  }, 120_000);
});
