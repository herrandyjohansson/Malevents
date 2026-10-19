import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { withSafeLinks } from "./normalize";
import { getSource } from "./sources";
import type { MalmoEvent } from "./types";
import { withCoordinates } from "./venues";

export type SourceResult =
  | { ok: true; events: MalmoEvent[]; fetchedAt: string }
  | { ok: false; error: string; fetchedAt: string };

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

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
 * it. A failure is cached only briefly ("seconds"), which also keeps a
 * broken upstream from being hammered on every request.
 */
export async function fetchSource(id: string): Promise<SourceResult> {
  "use cache: remote";
  const source = getSource(id);
  if (!source) throw new Error(`Unknown source "${id}"`);
  cacheTag("events", `events:${id}`);

  let events: MalmoEvent[];
  try {
    events = (await source.fetchEvents()).map((e) => withSafeLinks(withCoordinates(e), source.homepage));
  } catch (err) {
    cacheLife("seconds");
    return { ok: false, error: err instanceof Error ? err.message : String(err), fetchedAt: new Date().toISOString() };
  }

  cacheLife(LIFETIMES[source.cacheProfile ?? "hours"]);
  return { ok: true, events, fetchedAt: new Date().toISOString() };
}
