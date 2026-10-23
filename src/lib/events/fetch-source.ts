import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { errorMessage, log, since } from "@/lib/log";

import { SourceError } from "./http";
import { refineEvent, withSafeLinks } from "./normalize";
import { getSource } from "./sources";
import type { MalmoEvent } from "./types";
import { withCoordinates } from "./venues";

export type SourceResult =
  | { ok: true; events: MalmoEvent[]; warnings: string[]; fetchedAt: string }
  | { ok: false; error: string; fetchedAt: string };

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long a failure is kept. `expire` sits just past `revalidate` so a
 * failure is never served stale with a background refresh behind it: on
 * Vercel that refresh is not kept alive, the instance freezes mid-fetch,
 * and on thaw the request timer fires and caches a fresh "timeout" failure
 * even when the upstream is back. The next request refetches in the
 * foreground instead, where the aggregator keeps it alive with `after`.
 */
const FAILURE_LIFETIME = { stale: 30, revalidate: 15, expire: 16 } as const;

/**
 * How often each profile refreshes in the background (`revalidate`) and how
 * long a stale copy may still be served while that happens (`expire`). The
 * long expiry is the point: once a source has been fetched, visitors get the
 * cached copy instantly and the slow scrape runs behind the scenes.
 */
const LIFETIMES = {
  minutes: { stale: MINUTE, revalidate: MINUTE, expire: DAY },
  hours: { stale: 5 * MINUTE, revalidate: HOUR, expire: 7 * DAY },
  days: { stale: 5 * MINUTE, revalidate: DAY, expire: 30 * DAY },
} as const;

/**
 * The one cached entry point for every source. Each source gets its own
 * cache entry (keyed by id) and tags, so the admin can refresh one source
 * without touching the others.
 *
 * The cache is remote ("use cache: remote", Vercel's Runtime Cache) rather
 * than in-memory: serverless instances don't share or keep memory, so with
 * plain "use cache" each cold instance re-scraped every venue site before it
 * could render anything.
 *
 * Failures are returned rather than thrown: errors thrown inside a cache
 * scope reach production with their message redacted, and the admin needs
 * it. A failure is cached only briefly (FAILURE_LIFETIME), which also keeps
 * a broken upstream from being hammered on every request.
 */
export async function fetchSource(id: string): Promise<SourceResult> {
  "use cache: remote";
  const source = getSource(id);
  if (!source) throw new Error(`Unknown source "${id}"`);
  cacheTag("events", `events:${id}`);

  // Only runs on a cache miss, so each line below is one real fetch from the upstream.
  const started = performance.now();
  const warnings: string[] = [];
  const report = { warn: (message: string) => warnings.push(message) };
  let events: MalmoEvent[];
  try {
    events = (await source.fetchEvents(report)).map((e) => refineEvent(withSafeLinks(withCoordinates(e), source.homepage)));
  } catch (err) {
    cacheLife(FAILURE_LIFETIME);
    const error = errorMessage(err);
    const reason = err instanceof SourceError ? err.reason : "other";
    log.warn("source.fetch_failed", { source: id, reason, durationMs: since(started), error });
    return { ok: false, error, fetchedAt: new Date().toISOString() };
  }

  const profile = source.cacheProfile ?? "hours";
  cacheLife(LIFETIMES[profile]);
  const unplaced = events.filter((e) => e.venue?.lat === undefined).length;
  log.info("source.fetched", {
    source: id,
    durationMs: since(started),
    events: events.length,
    unplaced,
    timeUnknown: events.filter((e) => e.timeUnknown).length,
    cacheProfile: profile,
    warnings,
  });
  return { ok: true, events, warnings, fetchedAt: new Date().toISOString() };
}
