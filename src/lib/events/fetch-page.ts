import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { fetchText } from "./http";

/**
 * Fetch an event detail page with its own long-lived cache entry. Adapters
 * that enrich listings from detail pages call this per event, so an hourly
 * refresh of the listing only fetches pages for events it hasn't seen.
 * Errors are not cached, so a failed page is retried next time.
 */
export async function fetchDetailPage(sourceId: string, url: string): Promise<string> {
  "use cache";
  cacheTag("events", `events:${sourceId}`, `events:${sourceId}:detail`);
  cacheLife("days");
  return fetchText(sourceId, url);
}
