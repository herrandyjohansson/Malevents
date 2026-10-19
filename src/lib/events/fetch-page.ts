import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { fetchText } from "./http";

/**
 * Fetch an event detail page with its own long-lived cache entry. Adapters
 * that enrich listings from detail pages call this per event, so an hourly
 * refresh of the listing only fetches pages for events it hasn't seen.
 * Errors are not cached, so a failed page is retried next time.
 *
 * Remote for the same reason as `fetchSource`: an in-memory entry is lost
 * with every cold serverless instance, which re-fetched every detail page.
 * It runs nested inside `fetchSource`'s remote cache, which is allowed.
 */
export async function fetchDetailPage(sourceId: string, url: string): Promise<string> {
  "use cache: remote";
  cacheTag("events", `events:${sourceId}`, `events:${sourceId}:detail`);
  cacheLife("days");
  return fetchText(sourceId, url);
}
