import "server-only";

import { LIVE_MODE } from "../config";
import { fetchPageMeta, type PageMeta } from "../crawl";
import { daysFromTodayAt } from "../demo-dates";
import { fetchText } from "../http";
import { parsePriceText, toCategory } from "../normalize";
import { loadHtml, textOf } from "../scrape";
import type { EventCategory, EventSource, MalmoEvent, SourceReport } from "../types";

const ID = "skanes-dansteater";
const SITE = "https://www.skanesdansteater.se";
const CALENDAR_URL = `${SITE}/kalender`;
const DETAIL_CONCURRENCY = 3;

/** Where performances in Malmö take place; others (touring dates) are left out. */
const VENUES: Record<string, { name: string; address: string; lat: number; lng: number }> = {
  "skånes dansteater": { name: "Skånes Dansteater", address: "Östra Varvsgatan 13A", lat: 55.6162, lng: 12.9853 },
  "malmö opera": { name: "Malmö Opera", address: "Östra Rönneholmsvägen 20", lat: 55.5986, lng: 12.9905 },
};

export interface DansteaterRow {
  url: string;
  title: string;
  /** "Föreställningar", "Workshoppar" or "Evenemang". */
  type: string;
  /** ISO with offset, from the `<time datetime>`. */
  startsAt: string;
  facility: string;
  priceText?: string;
  ticketUrl?: string;
  soldOut: boolean;
}

/**
 * The calendar page lists the coming performances as `<article
 * class="performance">`, each with its time as a `<time datetime>`. The
 * time and place appear twice (mobile and desktop copies); the first is read.
 */
export function parseDansteaterCalendar(html: string): DansteaterRow[] {
  const $ = loadHtml(html);
  return $("article.performance")
    .toArray()
    .map((el) => {
      const article = $(el);
      const link = article.find("a.performance__title").first();
      const priceText = textOf($, article.find(".performance__price-range").first());
      return {
        url: link.attr("href") ? new URL(link.attr("href")!, SITE).toString() : "",
        title: textOf($, link),
        type: textOf($, article.find(".performance__production-type").first()),
        startsAt: article.find("time[datetime]").first().attr("datetime") ?? "",
        facility: textOf($, article.find(".performance__facility").first()),
        priceText: priceText || undefined,
        ticketUrl: article.find('a[href*="biljetter.skanesdansteater.se"]').first().attr("href"),
        soldOut: /slutsål|utsål|sold out/i.test(textOf($, article)),
      };
    })
    .filter((row) => row.url && row.title && row.startsAt);
}

function category(row: DansteaterRow): EventCategory {
  if (/workshop/i.test(row.type)) return "talks";
  const guess = toCategory(row.title);
  // Everything else on a dance company's calendar is a performance.
  return guess === "other" || guess === "music" ? "theatre" : guess;
}

export function dansteaterRowToEvent(row: DansteaterRow, meta: PageMeta | undefined): MalmoEvent | undefined {
  const venue = VENUES[row.facility.toLowerCase()];
  if (!venue) return undefined;
  const start = new Date(row.startsAt);
  if (Number.isNaN(start.getTime())) return undefined;
  return {
    id: `${ID}:${new URL(row.url).pathname.replace(/^\//, "")}@${start.toISOString().slice(0, 16)}`,
    sourceId: ID,
    title: row.title,
    description: meta?.description,
    startsAt: start.toISOString(),
    category: category(row),
    venue: { name: venue.name, address: venue.address, city: "Malmö", lat: venue.lat, lng: venue.lng },
    ...parsePriceText(row.priceText),
    imageUrl: meta?.image,
    url: row.url,
    ticketUrl: row.ticketUrl,
    soldOut: row.soldOut || undefined,
  };
}

/**
 * Skånes Dansteater (the regional dance company in Västra Hamnen):
 * performances, workshops and events from its server-rendered calendar,
 * with each production's picture and summary from its page.
 */
async function getDansteaterEvents(report: SourceReport): Promise<MalmoEvent[]> {
  const rows = parseDansteaterCalendar(LIVE_MODE ? await fetchText(ID, CALENDAR_URL) : demoHtml());
  const productions = [...new Set(rows.map((r) => r.url))];
  const metaByUrl = LIVE_MODE ? await fetchPageMeta(ID, report, productions, DETAIL_CONCURRENCY) : new Map<string, PageMeta>();
  return rows
    .map((row) => dansteaterRowToEvent(row, metaByUrl.get(row.url)))
    .filter((e): e is MalmoEvent => e !== undefined);
}

export const skanesDansteater: EventSource = {
  id: ID,
  name: "Skånes Dansteater",
  homepage: CALENDAR_URL,
  description: "Skånes Dansteater's performances, workshops and events in Malmö, from its calendar page.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: CALENDAR_URL,
  demo: !LIVE_MODE,
  fetchEvents: getDansteaterEvents,
};

/** Two calendar entries in the page's markup, dated from today. */
function demoHtml() {
  const entry = (title: string, slug: string, type: string, day: number, time: string, price: string) => `
<article class="performance">
  <div class="performance__production-type">${type}</div>
  <a class="performance__title" href="${SITE}/${slug}">${title}</a>
  <div class="performance__date"><time datetime="${daysFromTodayAt(day, time)}">${time}</time></div>
  <div class="performance__facility"><i></i> Skånes Dansteater</div>
  <div class="performance__price-range">${price}</div>
  <a href="https://biljetter.skanesdansteater.se/sv/buyingflow/dateproducts/1/${day}">Köp biljett</a>
</article>`;
  return `<div class="grid">${entry("Danslördag", "danslordag", "Föreställningar", 3, "15:00", "100 - 180 kr")}${entry("Känn på: dans", "kann-pa", "Workshoppar", 3, "14:00", "Fri entré")}</div>`;
}
