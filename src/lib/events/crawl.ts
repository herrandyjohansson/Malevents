import "server-only";

import { log, since } from "@/lib/log";

import { fetchDetailPage } from "./fetch-page";
import { fetchText } from "./http";
import { loadHtml, mapLimit, pageMeta } from "./scrape";
import type { SourceReport } from "./types";

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

interface ListingCrawl<T> {
  sourceId: string;
  report: SourceReport;
  maxPages: number;
  /** URL of listing page `page`, counting from 0. */
  pageUrl: (page: number) => string;
  /** The items on a page; return [] to stop (e.g. when a page only repeats earlier ones). */
  parse: (html: string) => T[];
  /** Whether the page links to page `page + 1`. */
  hasNextPage: (html: string, page: number) => boolean;
}

/**
 * Read a paged listing one page at a time. The first page is required, so its
 * failure throws and fails the source. A later page failing ends the crawl
 * with what was read so far and is reported, so a shortened listing shows up
 * in the admin instead of passing as "the site has no more pages".
 */
export async function crawlListing<T>({ sourceId, report, maxPages, pageUrl, parse, hasNextPage }: ListingCrawl<T>) {
  const started = performance.now();
  const items: T[] = [];
  let pages = 0;
  let stop: "last_page" | "empty_page" | "page_failed" | "max_pages" = "max_pages";
  for (let page = 0; page < maxPages; page++) {
    let html: string;
    try {
      html = await fetchText(sourceId, pageUrl(page));
    } catch (err) {
      if (page === 0) throw err;
      report.warn(`Listing page ${page + 1} failed, so the listing stops there: ${message(err)}`);
      stop = "page_failed";
      break;
    }
    pages++;
    const found = parse(html);
    if (found.length === 0) {
      stop = "empty_page";
      break;
    }
    items.push(...found);
    if (!hasNextPage(html, page)) {
      stop = "last_page";
      break;
    }
  }
  log.info("crawl.listing", { source: sourceId, pages, maxPages, items: items.length, stop, durationMs: since(started) });
  return items;
}

interface DetailFetch<T> {
  sourceId: string;
  report: SourceReport;
  urls: string[];
  parse: (html: string) => T;
  /** Used for pages that failed or were skipped. */
  fallback: T;
  concurrency: number;
  /** Read at most this many pages (the first ones); the rest get `fallback`. */
  max?: number;
}

/**
 * Fetch and parse one detail page per URL through the long-lived page cache,
 * a few at a time to stay polite. A failed page doesn't fail the source: it
 * gets `fallback`, and the failures are summed up in one report warning.
 */
export async function fetchDetails<T>({ sourceId, report, urls, parse, fallback, concurrency, max = Infinity }: DetailFetch<T>) {
  const started = performance.now();
  const errors: string[] = [];
  const results = await mapLimit(urls, concurrency, async (url, index) => {
    if (index >= max) return fallback;
    try {
      return parse(await fetchDetailPage(sourceId, url));
    } catch (err) {
      errors.push(message(err));
      return fallback;
    }
  });
  const attempted = Math.min(urls.length, max);
  // Detail pages have their own cache, so durationMs shows how many were fetched fresh.
  log.info("crawl.details", {
    source: sourceId,
    urls: urls.length,
    attempted,
    failed: errors.length,
    skipped: urls.length - attempted,
    durationMs: since(started),
  });
  if (errors.length > 0) {
    report.warn(`${errors.length} of ${attempted} detail pages failed and lack their details (first: ${errors[0]})`);
  }
  if (urls.length > max) {
    report.warn(`Only the first ${max} of ${urls.length} detail pages are read; the rest lack their details`);
  }
  return results;
}

export type PageMeta = ReturnType<typeof pageMeta>;

/** Open Graph image and description per production page, keyed by URL (see fetchDetails). */
export async function fetchPageMeta(sourceId: string, report: SourceReport, urls: string[], concurrency: number) {
  const metas = await fetchDetails<PageMeta | undefined>({
    sourceId,
    report,
    urls,
    parse: (html) => pageMeta(loadHtml(html)),
    fallback: undefined,
    concurrency,
  });
  return new Map(urls.map((url, i) => [url, metas[i]]));
}
