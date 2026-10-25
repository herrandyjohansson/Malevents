import "server-only";

import { LIVE_MODE } from "../config";
import { daysFromTodayAt } from "../demo-dates";
import { crawlListing, fetchDetails } from "../crawl";
import { malmoToday } from "../malmo-time";
import { parsePriceText, toCategory } from "../normalize";
import { findCards, loadHtml, pageMeta, parseSwedishDate, SWEDISH_MONTHS, textOf, toIso } from "../scrape";
import type { EventSource, MalmoEvent, SourceReport } from "../types";

const TICKSTER = "https://www.tickster.com";
/** Event links carry the date: /se/sv/events/{eventId}/{YYYY-MM-DD}/{slug}. */
const EVENT_LINK = 'a[href*="/events/"]';
const EVENT_PATH = /\/events\/([a-z0-9]+)\/(\d{4}-\d{2}-\d{2})\/[^/?#]+/i;
const PAGE_SIZE = 24;
const MAX_PAGES = 4;
const DETAIL_CONCURRENCY = 4;
/** Event pages read per refresh (soonest first); the rest show without a start time until they move up. */
const MAX_DETAILS = 150;
/** Passes, gift cards and memberships are listed like events but aren't ones. */
const NOT_AN_EVENT = /season pass|säsongskort|presentkort|gift ?card|medlemskap|membership/i;
/** Labels of the buy / sold-out button that follows the place on a listing card. */
const TICKET_BUTTON = /\s+(?:Köp|Buy|Försäljning|Slutsål|Utsål|Sold)\b/i;

export interface TicksterListing {
  ticksterId: string;
  url: string;
  ymd: string;
  title: string;
  /** "Inkonst, Malmö" from "10 okt 2026, Inkonst, Malmö". */
  place?: string;
  ticketUrl?: string;
}

export interface TicksterDetail {
  time?: string;
  priceText?: string;
  image?: string;
  description?: string;
  soldOut?: boolean;
}

/** "Babel, Malmö" → { name: "Babel", city: "Malmö" }; coordinates come from venues.ts. */
function placeToVenue(place: string | undefined): MalmoEvent["venue"] {
  if (!place) return undefined;
  const parts = place.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  return { name: parts[0], city: parts.length > 1 ? parts[parts.length - 1] : undefined };
}

/** Parse a Tickster organizer page ("events by …"). */
export function parseTicksterListing(html: string): TicksterListing[] {
  const $ = loadHtml(html);
  const byId = new Map<string, TicksterListing>();
  for (const card of findCards($, EVENT_LINK, TICKSTER, (t) => parseSwedishDate(t) !== undefined)) {
    const match = new URL(card.href).pathname.match(EVENT_PATH);
    if (!match) continue;
    const [, ticksterId, ymd] = match;
    const heading = card.el.find("h1, h2, h3, h4").first();
    const titleLink = card.el.find(EVENT_LINK).filter((_, a) => $(a).text().trim() !== "").first();
    const title = (heading.length ? textOf($, heading) : textOf($, titleLink)).trim();
    if (!title || NOT_AN_EVENT.test(title)) continue;
    const date = parseSwedishDate(card.text);
    if (!date) continue;
    // The card reads "<title> 10 okt 2026, Inkonst, Malmö Köp": skip the date up to its
    // comma, then cut at the ticket button to keep "Inkonst, Malmö".
    const afterDate = card.text.slice(date.index).replace(/^[^,]*,\s*/, "");
    const place = afterDate.split(TICKET_BUTTON)[0].trim() || undefined;
    const ticketUrl = card.el.find('a[href*="secure.tickster.com"]').first().attr("href");
    byId.set(`${ticksterId}|${ymd}`, { ticksterId, url: card.href, ymd, title, place, ticketUrl });
  }
  return [...byId.values()];
}

/** Read a Tickster event page: "Startar 10 okt 23:59", "150:-", sold-out text and og:image. */
export function parseTicksterDetail(html: string): TicksterDetail {
  const $ = loadHtml(html);
  const text = textOf($, $("body"));
  const start = text.match(/(?:Startar|Starts|Start)\s+(?:\S+\s+){0,3}?(\d{1,2})[.:](\d{2})/i);
  // "150:-" or "150 kr"; the lookbehind keeps "00-04 150:-" from reading as 4150.
  const price = text.match(/(?<![\d-])(\d{1,5})\s*(?::-|kr\b|SEK\b)/i);
  const meta = pageMeta($);
  return {
    time: start ? `${start[1].padStart(2, "0")}:${start[2]}` : undefined,
    priceText: price ? `${price[1]} kr` : /gratis|fri entré|free entry/i.test(text) ? "Gratis" : undefined,
    image: meta.image,
    description: meta.description,
    soldOut: /slutsåld|utsåld|sold out/i.test(text),
  };
}

interface TicksterSourceOptions {
  id: string;
  name: string;
  description: string;
  /** The organizer's public page, e.g. https://www.tickster.com/se/sv/events/by/{orgId}/{slug}. */
  organizerUrl: string;
  /** The venue's own site, linked from the admin. */
  homepage: string;
  /** Fixed venue for a single-venue organizer; otherwise each event's place text is used. */
  venue?: NonNullable<MalmoEvent["venue"]>;
  /** Listing page size and how many pages to read (default 24 × 4). */
  pageSize?: number;
  maxPages?: number;
  /** Extra query string for the listing, e.g. "sort=eventstart". */
  query?: string;
  /** Keep only listings whose place text matches (organizers sometimes tour). */
  placeFilter?: RegExp;
  /** Lists many venues' events (see `EventSource.aggregator`). */
  aggregator?: boolean;
  /** Fixtures used when EVENTS_LIVE=false. */
  demo: () => { listingHtml: string; detailHtml: (l: TicksterListing) => string };
}

function fetchListings(options: TicksterSourceOptions, report: SourceReport) {
  const { organizerUrl, pageSize = PAGE_SIZE, maxPages = MAX_PAGES, query } = options;
  return crawlListing({
    sourceId: options.id,
    report,
    maxPages,
    pageUrl: (page) => `${organizerUrl}?skip=${page * pageSize}&take=${pageSize}${query ? `&${query}` : ""}`,
    parse: parseTicksterListing,
    hasNextPage: (html, page) => html.includes(`skip=${(page + 1) * pageSize}`),
  });
}

/** Listings from today on, soonest first, keeping only those whose place matches `placeFilter`. */
function upcomingListings(listings: TicksterListing[], placeFilter?: RegExp) {
  const today = malmoToday();
  return listings
    .filter((listing) => listing.ymd >= today && (!placeFilter || !listing.place || placeFilter.test(listing.place)))
    .sort((a, b) => a.ymd.localeCompare(b.ymd));
}

function ticksterToEvent(
  sourceId: string,
  venue: TicksterSourceOptions["venue"],
  listing: TicksterListing,
  detail: TicksterDetail,
): MalmoEvent {
  return {
    id: `${sourceId}:${listing.ticksterId}@${listing.ymd}`,
    sourceId,
    title: listing.title,
    description: detail.description,
    // The listing only has the date; the time comes from the event page.
    startsAt: toIso({ ymd: listing.ymd, time: detail.time }),
    timeUnknown: detail.time ? undefined : true,
    category: toCategory(listing.title, detail.description),
    venue: venue ?? placeToVenue(listing.place),
    ...parsePriceText(detail.priceText),
    imageUrl: detail.image,
    url: listing.url,
    ticketUrl: listing.ticketUrl,
    soldOut: detail.soldOut || undefined,
  };
}

/**
 * Many Malmö venues sell through Tickster, whose public organizer pages list
 * every event with the date in the link. This factory turns one organizer
 * page into a source, enriching each event from its (long-cached) page for
 * the start time, price and image. Keyless: no Tickster API key involved.
 */
export function ticksterSource(options: TicksterSourceOptions): EventSource {
  const { id, venue } = options;

  async function getEvents(report: SourceReport): Promise<MalmoEvent[]> {
    const fixtures = LIVE_MODE ? undefined : options.demo();
    const listings = fixtures ? parseTicksterListing(fixtures.listingHtml) : await fetchListings(options, report);
    const upcoming = upcomingListings(listings, options.placeFilter);
    const details = fixtures
      ? upcoming.map((listing) => parseTicksterDetail(fixtures.detailHtml(listing)))
      : await fetchDetails<TicksterDetail>({
          sourceId: id,
          report,
          urls: upcoming.map((listing) => listing.url),
          parse: parseTicksterDetail,
          fallback: {},
          concurrency: DETAIL_CONCURRENCY,
          max: MAX_DETAILS,
        });
    return upcoming.map((listing, i) => ticksterToEvent(id, venue, listing, details[i]));
  }

  return {
    id,
    name: options.name,
    homepage: options.homepage,
    description: options.description,
    kind: LIVE_MODE ? "html" : "fixture",
    endpoint: options.organizerUrl,
    demo: !LIVE_MODE,
    aggregator: options.aggregator,
    timeoutMs: 45000,
    fetchEvents: getEvents,
  };
}

/** Fixture helpers shared by Tickster-based sources: markup as Tickster renders it. */
export function ticksterDemoListing(organizer: string, events: { id: string; slug: string; title: string; day: number }[]) {
  const cards = events.map((e) => {
    const ymd = daysFromTodayAt(e.day, "12:00").slice(0, 10);
    const [y, m, d] = ymd.split("-").map(Number);
    return `<li class="c-event-card">
      <h2><a href="/se/sv/events/${e.id}/${ymd}/${e.slug}">${e.title}</a></h2>
      <p>${d} ${SWEDISH_MONTHS[m - 1].slice(0, 3)} ${y}, ${organizer}, Malmö</p>
      <a href="https://secure.tickster.com/sv/${e.id}" title="Köp biljett till ${e.title}">Köp</a>
    </li>`;
  });
  return `<main><ul>${cards.join("")}</ul></main>`;
}

export function ticksterDemoDetail(time: string, price: string, extra = "") {
  return `<html><head><meta property="og:image" content="https://static.tickster.com/demo.jpg"></head>
    <body><p>Startar ${time}</p><p>${price}</p>${extra}</body></html>`;
}
