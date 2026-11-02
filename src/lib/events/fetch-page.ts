import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { fetchText } from "./http";

const DAY = 24 * 60 * 60;

/**
 * A detail page (description, image, run of dates) rarely changes once it is
 * up, and each refresh is one Runtime Cache write per page per region, the
 * bulk of the site's writes. So pages are refreshed weekly rather than daily,
 * and kept for a month while unvisited.
 */
const DETAIL_PAGE_LIFETIME = { stale: 5 * 60, revalidate: 7 * DAY, expire: 30 * DAY } as const;

/**
 * Fetch an event detail page with its own long-lived cache entry. Adapters
 * that enrich listings from detail pages call this per event, so a scheduled
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
  cacheLife(DETAIL_PAGE_LIFETIME);
  return fetchText(sourceId, url);
}
