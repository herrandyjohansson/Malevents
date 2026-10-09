import "server-only";

import { LIVE_MODE } from "../config";
import { malmoTime } from "../demo-dates";
import { fetchDetailPage } from "../fetch-page";
import { fetchText } from "../http";
import { parsePriceText, toCategory } from "../map";
import { findCards, loadHtml, mapLimit, pageMeta, parseSwedishDate, type ParsedDate, textOf, toIso } from "../scrape";
import type { EventSource, MalmoEvent } from "../types";

const ID = "malmo-stadsteater";
const SITE = "https://www.malmostadsteater.se";
const CALENDAR_URL = `${SITE}/kalender`;
const STAGE_LINK = 'a[href*="/vara-scener-och-besoksplatser/"]';
const DETAIL_CONCURRENCY = 3;

/** Stages are spread over town, so each gets its own pin. */
const STAGES: Record<string, { address: string; lat: number; lng: number }> = {
  hippodromen: { address: "Kalendegatan 12", lat: 55.6005, lng: 13.0028 },
  intiman: { address: "Östra Rönneholmsvägen 20", lat: 55.5986, lng: 12.9905 },
  "studion och verkstan": { address: "Östra Rönneholmsvägen 20", lat: 55.5986, lng: 12.9905 },
  studion: { address: "Östra Rönneholmsvägen 20", lat: 55.5986, lng: 12.9905 },
  verkstan: { address: "Östra Rönneholmsvägen 20", lat: 55.5986, lng: 12.9905 },
};

export interface StadsteaterRow {
  url: string;
  title: string;
  stage: string;
  startsAt: string;
  priceText?: string;
  ticketUrl?: string;
  soldOut: boolean;
  fewLeft: boolean;
}

const TIME = /\b(\d{1,2})[:.](\d{2})\b/;

/**
 * The calendar is one long server-rendered list (about five months ahead).
 * Each performance row links to its stage; the date may sit in the row or
 * in a day heading above a group of rows, so rows without their own date
 * take the nearest date heading before them in document order.
 */
export function parseStadsteaterCalendar(html: string, today?: string): StadsteaterRow[] {
  const $ = loadHtml(html);
  const order = new Map($("*").toArray().map((el, i) => [el, i]));
  const headings: { index: number; date: ParsedDate }[] = [];
  $("*").each((_, el) => {
    if ($(el).children().length > 0) return;
    const text = $(el).text().trim();
    if (text.length > 40) return;
    const date = parseSwedishDate(text, today);
    if (date) headings.push({ index: order.get(el)!, date });
  });

  const rows: StadsteaterRow[] = [];
  for (const card of findCards($, STAGE_LINK, SITE, (t) => TIME.test(t))) {
    const index = order.get(card.el.get(0)!) ?? 0;
    const own = parseSwedishDate(card.text, today);
    const date = own ?? headings.filter((h) => h.index < index).pop()?.date;
    const time = card.text.match(TIME);
    if (!date || !time) continue;

    const stageLink = card.el.find(STAGE_LINK).first();
    const titleLink = card.el
      .find("a[href]")
      .filter((_, a) => {
        const href = new URL($(a).attr("href")!, SITE);
        return href.host === new URL(SITE).host && href.pathname.length > 1 && !href.pathname.startsWith("/vara-scener");
      })
      .first();
    const title = titleLink.text().replace(/\s+/g, " ").trim();
    if (!title) continue;
    const ticketUrl = card.el.find('a[href*="biljetter.malmostadsteater.se"]').first().attr("href");

    rows.push({
      url: new URL(titleLink.attr("href")!, SITE).toString(),
      title,
      stage: textOf($, stageLink),
      startsAt: toIso({ ymd: date.ymd, time: `${time[1].padStart(2, "0")}:${time[2]}` }),
      priceText: card.text.match(/\d+\s*[-–]\s*\d+\s*kr|\d+\s*kr|gratis|fri entré/i)?.[0],
      ticketUrl,
      soldOut: /utsåld|slutsåld/i.test(card.text),
      fewLeft: /få platser/i.test(card.text),
    });
  }
  return rows;
}

/**
 * Malmö Stadsteater (Hippodromen, Intiman, Studion, Verkstan). Drupal 11
 * with no public feed, so the calendar page is read with cheerio and each
 * production page adds its image and blurb (one cached fetch per production).
 */
async function getStadsteaterEvents(): Promise<MalmoEvent[]> {
  const rows = LIVE_MODE ? parseStadsteaterCalendar(await fetchText(ID, CALENDAR_URL)) : parseStadsteaterCalendar(demoHtml());
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
    const stage = STAGES[r.stage.toLowerCase()];
    const category = toCategory(r.title, meta?.description);
    return {
      id: `${ID}:${new URL(r.url).pathname.slice(1)}@${r.startsAt.slice(0, 16)}`,
      sourceId: ID,
      title: r.title,
      description: meta?.description,
      startsAt: r.startsAt,
      // It's a theatre: keyword hits like "konsert" or "familj" win, otherwise theatre.
      category: category === "other" || category === "art" ? "theatre" : category,
      venue: {
        name: r.stage ? `${r.stage}, Malmö Stadsteater` : "Malmö Stadsteater",
        address: stage?.address,
        city: "Malmö",
        lat: stage?.lat,
        lng: stage?.lng,
      },
      ...parsePriceText(r.priceText),
      imageUrl: meta?.image,
      url: r.url,
      ticketUrl: r.ticketUrl,
      soldOut: r.soldOut || undefined,
      notes: r.fewLeft ? ["Få platser kvar"] : undefined,
    };
  });
}

export const malmoStadsteater: EventSource = {
  id: ID,
  name: "Malmö Stadsteater",
  homepage: CALENDAR_URL,
  description: "Every performance at Hippodromen, Intiman, Studion and Verkstan, from the calendar page (cheerio) and production pages.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: CALENDAR_URL,
  demo: !LIVE_MODE,
  timeoutMs: 30000,
  fetchEvents: getStadsteaterEvents,
};

/** The calendar as rendered: day headings, then rows with time, title, stage, price and status. */
function demoHtml() {
  const days = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
  const months = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  const heading = (day: number) => {
    const iso = malmoTime(day, "12:00");
    const [, m, d] = iso.slice(0, 10).split("-").map(Number);
    return `<h3>${days[new Date(iso).getUTCDay()]} ${d} ${months[m - 1]}</h3>`;
  };
  const row = (time: string, slug: string, title: string, stage: string, price: string, status: string, ticket?: string) =>
    `<article><span>${time}</span><h4><a href="/${slug}">${title}</a></h4>
      <a href="/vara-scener-och-besoksplatser/${stage.toLowerCase()}">${stage}</a>
      <p>Pris ${price}</p><span>${status}</span>${ticket ? `<a href="${ticket}">köp biljetter</a>` : ""}</article>`;
  return `<main>
    ${heading(0)}
    ${row("19:00", "gengangare", "Gengångare", "Hippodromen", "150 - 550 kr", "", "https://biljetter.malmostadsteater.se/sv/mst/buyingflow/tickets/30799/125351")}
    ${row("19:00", "sommarkvallar-pa-jorden", "Sommarkvällar på jorden", "Intiman", "150 - 380 kr", "utsåld")}
    ${heading(1)}
    ${row("16:00", "sommarkvallar-pa-jorden", "Sommarkvällar på jorden", "Intiman", "150 - 380 kr", "få platser kvar", "https://biljetter.malmostadsteater.se/sv/mst/buyingflow/tickets/30794/125250")}
    ${heading(8)}
    ${row("19:00", "prima-facie", "Prima Facie", "Intiman", "200 - 420 kr", "", "https://biljetter.malmostadsteater.se/sv/mst/buyingflow/tickets/30900/126001")}
    ${heading(100)}
    ${row("18:00", "hotell-bergman", "Hotell Bergman – Tystnaden och Höstsonaten", "Intiman", "250 - 450 kr", "", "https://biljetter.malmostadsteater.se/sv/mst/buyingflow/tickets/31000/127001")}
  </main>`;
}
