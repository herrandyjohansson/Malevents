import "server-only";

import { LIVE_MODE } from "../config";
import { malmoTime } from "../demo-dates";
import { fetchDetailPage } from "../fetch-page";
import { fetchText } from "../http";
import { toCategory } from "../map";
import { findCards, loadHtml, mapLimit, pageMeta, parseSwedishDate, toIso } from "../scrape";
import type { EventSource, MalmoEvent } from "../types";

const ID = "malmo-opera";
const SITE = "https://www.malmoopera.se";
/** The calendar: one row per performance, 10 per page, `?page=N` from 0. */
const CALENDAR_URL = `${SITE}/malmo-opera`;
/** ~20 pages reach about eight months ahead; the loop stops early when pages run out. */
const MAX_PAGES = 30;
const DETAIL_CONCURRENCY = 3;

const VENUE = { name: "Malmö Opera", address: "Östra Rönneholmsvägen 20", city: "Malmö", lat: 55.5986, lng: 12.9905 };

export interface OperaRow {
  url: string;
  title: string;
  startsAt: string;
  ticketUrl?: string;
  /** "Ledigt", "Fåtal", "Slutsålt" – or a town name for touring performances. */
  status: string;
}

/**
 * Parse calendar rows like "fre 9 okt 19.00 Mozart, Brahms, Schumann  Ledigt  Köp".
 * Touring performances (tickets via Riksteatern, a town instead of a status)
 * are dropped, since they don't happen in Malmö.
 */
export function parseOperaCalendar(html: string, today?: string): OperaRow[] {
  const $ = loadHtml(html);
  const rows: OperaRow[] = [];
  for (const card of findCards($, 'a[href*="/forestallningar/"]', SITE, (t) => parseSwedishDate(t)?.time !== undefined)) {
    const date = parseSwedishDate(card.text, today)!;
    const titleLink = card.el.find('a[href*="/forestallningar/"]').first();
    const title = (titleLink.length ? titleLink.text() : card.text).replace(/\s+/g, " ").trim();
    const ticketUrl = card.el.find('a[href*="biljett"], a[href*="riksteatern"], a[href*="tickster"]').first().attr("href");
    if (ticketUrl && /riksteatern\.se/.test(ticketUrl)) continue;
    const status = card.text
      .slice(card.text.indexOf(title) + title.length)
      .replace(/\bKöp\b.*$/, "")
      .trim();
    rows.push({ url: card.href, title, startsAt: toIso(date), ticketUrl, status });
  }
  return rows;
}

async function fetchCalendar(): Promise<OperaRow[]> {
  const rows: OperaRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    let html: string;
    try {
      html = await fetchText(ID, page === 0 ? CALENDAR_URL : `${CALENDAR_URL}?page=${page}`);
    } catch (err) {
      if (page === 0) throw err;
      break;
    }
    const found = parseOperaCalendar(html);
    if (found.length === 0) break;
    rows.push(...found);
    if (!html.includes(`page=${page + 1}`)) break;
  }
  return rows;
}

/**
 * Malmö Opera. Drupal like Malmö Live, but without a public JSON feed, so
 * this reads the server-rendered calendar with cheerio and takes the image
 * and blurb from each production's page (one cached fetch per production).
 */
async function getOperaEvents(): Promise<MalmoEvent[]> {
  const rows = LIVE_MODE ? await fetchCalendar() : parseOperaCalendar(demoCalendarHtml());
  const productions = [...new Set(rows.map((r) => r.url))];
  const metas = LIVE_MODE
    ? await mapLimit(productions, DETAIL_CONCURRENCY, (url) =>
        fetchDetailPage(ID, url)
          .then((html) => pageMeta(loadHtml(html)))
          .catch(() => ({ title: undefined, description: undefined, image: undefined })),
      )
    : productions.map(() => ({ title: undefined, description: undefined, image: undefined }));
  const metaByUrl = new Map(productions.map((url, i) => [url, metas[i]]));

  return rows.map((r): MalmoEvent => {
    const meta = metaByUrl.get(r.url);
    const soldOut = /slutsål|utsål/i.test(r.status);
    const category = toCategory(r.title, meta?.description);
    return {
      id: `${ID}:${new URL(r.url).pathname.split("/").pop()}@${r.startsAt.slice(0, 16)}`,
      sourceId: ID,
      title: r.title,
      description: meta?.description,
      startsAt: r.startsAt,
      // Everything at the opera is music unless it is clearly for kids, a musical or a talk;
      // guided tours stay "other". (Keyword matching alone reads "Mozart" as art.)
      category: ["family", "theatre", "talks"].includes(category)
        ? category
        : /visning|guid/i.test(r.title)
          ? "other"
          : "music",
      venue: VENUE,
      isFree: /gratis|fri entré/i.test(`${r.status} ${meta?.description ?? ""}`),
      imageUrl: meta?.image,
      url: r.url,
      ticketUrl: r.ticketUrl,
      soldOut: soldOut || undefined,
      notes: r.status && !soldOut ? [r.status] : undefined,
    };
  });
}

export const malmoOpera: EventSource = {
  id: ID,
  name: "Malmö Opera",
  homepage: CALENDAR_URL,
  description: "Opera, musicals and concerts at Malmö Opera, from the server-rendered calendar (cheerio) and production pages.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: CALENDAR_URL,
  demo: !LIVE_MODE,
  timeoutMs: 30000,
  fetchEvents: getOperaEvents,
};

function demoCalendarHtml() {
  const days = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"];
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const row = (day: number, time: string, slug: string, title: string, status: string, ticket: string) => {
    const iso = malmoTime(day, time);
    const date = new Date(iso);
    const [, m, d] = iso.slice(0, 10).split("-").map(Number);
    return `<div class="calendar-row">
      <span>${days[date.getUTCDay()]} ${d} ${months[m - 1]} ${time.replace(":", ".")}</span>
      <a href="/forestallningar/${slug}">${title}</a>
      <span>${status}</span>
      <a href="${ticket}">Köp</a>
    </div>`;
  };
  return `<main>
    ${row(0, "19:00", "mozart-brahms-schumann", "Mozart, Brahms, Schumann", "Ledigt", "https://biljetter.malmoopera.se/events/30511/30512?lang=sv")}
    ${row(1, "18:00", "i-list-lust", "I list &amp; lust", "Ängelholm", "https://www.riksteatern.se/forestallningar/i-list--lust/202610101800-139794G")}
    ${row(2, "10:00", "guidad-visning", "Guidad visning", "Fåtal", "https://biljetter.malmoopera.se/events/29979/29986?lang=sv")}
    ${row(5, "19:00", "rusalka", "Rusalka", "Ledigt", "https://biljetter.malmoopera.se/events/29170/29197?lang=sv")}
    ${row(8, "19:00", "rusalka", "Rusalka", "Slutsålt", "https://biljetter.malmoopera.se/events/29170/29198?lang=sv")}
  </main>`;
}
