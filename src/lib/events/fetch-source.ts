import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { getSource } from "./sources";
import type { MalmoEvent } from "./types";
import { withCoordinates } from "./venues";

export type SourceResult =
  | { ok: true; events: MalmoEvent[]; fetchedAt: string }
  | { ok: false; error: string; fetchedAt: string };

/**
 * The one cached entry point for every source. Each source gets its own
 * cache entry (keyed by id) and tags, so the admin can refresh one source
 * without touching the others.
 *
 * Failures are returned rather than thrown: errors thrown inside a cache
 * scope reach production with their message redacted, and the admin needs
 * it. A failure is cached only briefly ("seconds"), which also keeps a
 * broken upstream from being hammered on every request.
 */
export async function fetchSource(id: string): Promise<SourceResult> {
  "use cache";
  const source = getSource(id);
  if (!source) throw new Error(`Unknown source "${id}"`);
  cacheTag("events", `events:${id}`);

  let events: MalmoEvent[];
  try {
    events = (await source.fetchEvents()).map(withCoordinates);
  } catch (err) {
    cacheLife("seconds");
    return { ok: false, error: err instanceof Error ? err.message : String(err), fetchedAt: new Date().toISOString() };
  }

  // cacheLife is typed per profile literal, so branch rather than pass a variable.
  switch (source.cacheProfile ?? "hours") {
    case "minutes":
      cacheLife("minutes");
      break;
    case "days":
      cacheLife("days");
      break;
    default:
      cacheLife("hours");
  }
  return { ok: true, events, fetchedAt: new Date().toISOString() };
}
