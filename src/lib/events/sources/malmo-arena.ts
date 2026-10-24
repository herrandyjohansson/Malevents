import "server-only";

import { LIVE_MODE } from "../config";
import { fetchText } from "../http";
import { localDay } from "../malmo-time";
import { toCategory } from "../normalize";
import { loadHtml, parseSwedishDate, textOf, toIso } from "../scrape";
import type { EventCategory, EventSource, MalmoEvent } from "../types";

const ID = "malmo-arena";
const SITE = "https://www.malmoarena.com";
const LISTING_URL = `${SITE}/evenemang`;

const VENUE = { name: "Malmö Arena", address: "Hyllie Stationstorg 2", city: "Malmö", lat: 55.5653, lng: 12.9752 };

export interface ArenaRow {
  /** Event page slug, "/evenemang/<slug>". */
  slug: string;
  title: string;
  /** "Redhawks" (home games) or "Musik & Show". */
  type: string;
  /** "8 okt. | Kl 19:00": day and time, no year. */
  when: string;
  imageUrl?: string;
  ticketUrl?: string;
}

/** The listing is a HubSpot module: one `.event-listing__item` per event. */
export function parseArenaListing(html: string): ArenaRow[] {
  const $ = loadHtml(html);
  return $(".event-listing__item")
    .toArray()
    .map((el) => {
      const item = $(el);
      const info = item.find('a[href*="/evenemang/"]').first().attr("href") ?? "";
      const image = item.find(".event-listing__img-frame img").first().attr("src");
      return {
        slug: info.match(/\/evenemang\/([^/?#]+)/)?.[1] ?? "",
        title: textOf($, item.find("h2").first()),
        type: textOf($, item.find(".event-listing__second-block a").first()),
        when: textOf($, item.find(".event-listing__third-block").first()),
        // HubSpot appends a stray "|" to the image URL.
        imageUrl: image?.replace(/\|$/, "") || undefined,
        ticketUrl: item.find('a[title="Köp biljett"]').first().attr("href") || undefined,
      };
    })
    .filter((row) => row.slug && row.title && row.when);
}

/**
 * Everything that is not a Redhawks game is listed as "Musik & Show". The
 * keyword guess only picks among the kinds of show the arena hosts, because
 * titles trip it ("Disney on Ice – Discover" is not a disco, "Matiné" not food).
 */
function showCategory(title: string): EventCategory {
  if (/disney|on ice|barnen/i.test(title)) return "family";
  const guess = toCategory(title);
  return guess === "theatre" || guess === "family" ? guess : "music";
}

export function arenaRowToEvent(row: ArenaRow, today?: string): MalmoEvent | undefined {
  const date = parseSwedishDate(row.when, today);
  if (!date) return undefined;
  return {
    id: `${ID}:${row.slug}@${date.ymd}`,
    sourceId: ID,
    title: row.title,
    startsAt: toIso(date),
    timeUnknown: date.time ? undefined : true,
    category: /redhawks/i.test(row.type) ? "sports" : showCategory(row.title),
    venue: VENUE,
    isFree: false,
    imageUrl: row.imageUrl,
    url: `${SITE}/evenemang/${row.slug}`,
    ticketUrl: row.ticketUrl,
  };
}

/**
 * Malmö Arena (Hyllie): concerts, shows and Malmö Redhawks home games from
 * the server-rendered listing. The listing gives day and time without a
 * year, so the year is the next one with that date.
 */
async function getArenaEvents(): Promise<MalmoEvent[]> {
  const html = LIVE_MODE ? await fetchText(ID, LISTING_URL) : demoHtml();
  return parseArenaListing(html)
    .map((row) => arenaRowToEvent(row))
    .filter((e): e is MalmoEvent => e !== undefined);
}

export const malmoArena: EventSource = {
  id: ID,
  name: "Malmö Arena",
  homepage: LISTING_URL,
  description: "Malmö Arena's concerts, shows and Malmö Redhawks home games, from its events listing.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: LISTING_URL,
  demo: !LIVE_MODE,
  fetchEvents: getArenaEvents,
};

/** Two listing items in the page's markup, dated from today. */
function demoHtml() {
  const short = (days: number) => {
    const [, m, d] = localDay(new Date(Date.now() + days * 86_400_000)).split("-").map(Number);
    return `${d} ${["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"][m - 1]}.`;
  };
  const item = (slug: string, title: string, type: string, days: number, time: string) => `
<div class="event-listing__item">
  <div class="event-listing__first-block">
    <div class="event-listing__img-frame"><img src="${SITE}/hubfs/${slug}.jpg|" alt="${title}"></div>
    <h2 class="h5">${title}</h2>
  </div>
  <div class="event-listing__second-block"><a href="/evenemang?ecategories=2" title="${type}">${type}</a></div>
  <div class="event-listing__third-block"> ${short(days)} | Kl ${time} </div>
  <div class="event-listing__buttons">
    <a href="/evenemang/${slug}?hsLang=sv" title="Info">Info</a>
    <a href="https://www.ticketmaster.se/event/${days}" title="Köp biljett">Köp biljett</a>
  </div>
</div>`;
  return `<div class="event-listing">${item("malmo-redhawks-timra", "Malmö Redhawks - Timrå IK", "Redhawks", 2, "19:00")}${item(
    "benjamin-ingrosso",
    "Benjamin Ingrosso - What Happens Next?",
    "Musik &amp; Show",
    6,
    "19:30",
  )}</div>`;
}
