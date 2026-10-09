import "server-only";

import { LIVE_MODE } from "../config";
import { malmoTime } from "../demo-dates";
import { fetchDetailPage } from "../fetch-page";
import { decodeEntities, htmlToText, truncate } from "../html";
import { fetchJson, fetchText } from "../http";
import { parsePriceText, toCategory } from "../map";
import { findCards, loadHtml, mapLimit, pageMeta, parseSwedishDate, textOf, toIso } from "../scrape";
import type { EventSource, MalmoEvent } from "../types";

const ID = "moriska";
const SITE = "https://moriskapaviljongen.se";
const PROGRAM_URL = `${SITE}/biljetter-program-2/`;
const API = `${SITE}/wp-json/wp/v2/mp_event?per_page=100&_fields=link,title,excerpt,yoast_head_json`;
/** The programme lists 10 events per page; this covers the season ahead. */
const MAX_PAGES = 15;
/** Event pages fetched in parallel; each is cached for days, so this only matters for new events. */
const DETAIL_CONCURRENCY = 4;
/** Event pages read per refresh; later events keep the listing's data until they move up. */
const MAX_DETAILS = 60;

const VENUE = { name: "Moriska Paviljongen", address: "Norra Parkgatan 2", city: "Malmö", lat: 55.5932, lng: 13.0096 };

/** One card in the programme listing: link, text and the parsed date. */
export interface MoriskaListing {
  url: string;
  text: string;
  /** Text before the date: title plus the room label, e.g. "… Jazzklubb". */
  heading: string;
  startsAt: string;
}

/** The subset of the `mp_event` REST post we use (dates are not exposed there). */
export interface MoriskaPost {
  link: string;
  title: { rendered: string };
  excerpt?: { rendered: string };
  yoast_head_json?: { og_image?: { url: string }[] };
}

/** What an event's own page adds: the year-qualified date, price and ticket link. */
export interface MoriskaDetail {
  startsAt?: string;
  priceText?: string;
  ticketUrl?: string;
  image?: string;
  description?: string;
}

function normalizeUrl(url: string) {
  return new URL(url, SITE).toString().replace(/\/+$/, "").toLowerCase();
}

/**
 * Pull event cards out of a programme page. The theme's markup is not
 * documented, so this keys on what is stable: each card holds a link to
 * /program/<slug>/ and a Swedish date with a time ("09 oktober 17.30").
 */
export function parseMoriskaProgram(html: string, today?: string): MoriskaListing[] {
  const $ = loadHtml(html);
  const byKey = new Map<string, MoriskaListing>();
  for (const card of findCards($, 'a[href*="/program/"]', SITE, (t) => parseSwedishDate(t)?.time !== undefined)) {
    const date = parseSwedishDate(card.text, today)!;
    const startsAt = toIso(date);
    // The same slug is sometimes reused for two dates, so key on both.
    byKey.set(`${normalizeUrl(card.href)}|${startsAt}`, {
      url: card.href,
      text: card.text,
      heading: card.text.slice(0, date.index).trim(),
      startsAt,
    });
  }
  return [...byKey.values()];
}

/** Read an event page: "26 november 2026 | 18:30", "595 kr + serviceavgift", the Nortic link. */
export function parseMoriskaDetail(html: string): MoriskaDetail {
  const $ = loadHtml(html);
  const text = textOf($, $("main").length ? $("main") : $("body"));
  const date = parseSwedishDate(text);
  const price = text.match(/(?:fri entré|gratis|\d[\d\s]*(?:[–-]\s*\d+)?\s*(?:kr|:-|sek)\b[^.|]{0,30})/i)?.[0];
  const ticket = $('a[href*="nortic.se"], a[href*="tickster.com"], a[href*="ticketmaster."]').first().attr("href");
  const meta = pageMeta($);
  return {
    startsAt: date?.time && /\d{4}/.test(text.slice(date.index, date.index + 25)) ? toIso(date) : undefined,
    priceText: price?.trim(),
    ticketUrl: ticket,
    image: meta.image,
    description: meta.description,
  };
}

/** True when the page links to a further page of the programme. */
export function hasNextPage(html: string, page: number) {
  return html.includes(`/page/${page + 1}/`);
}

export function moriskaToEvent(
  listing: MoriskaListing,
  post: MoriskaPost | undefined,
  detail: MoriskaDetail = {},
): MalmoEvent {
  const title = post ? decodeEntities(post.title.rendered).trim() : listing.heading || listing.text;
  const excerpt = (post?.excerpt ? htmlToText(post.excerpt.rendered) : undefined) || detail.description;
  const price = parsePriceText(detail.priceText);
  // What the card shows besides the title is the room (Jazzklubb, RedRoom, GrandFloor …).
  const heading = listing.heading.toLowerCase();
  const room = post && heading.startsWith(title.toLowerCase()) ? listing.heading.slice(title.length).trim() || undefined : undefined;
  return {
    id: `${ID}:${new URL(listing.url).pathname.replace(/^\/program\/|\/$/g, "")}@${listing.startsAt.slice(0, 16)}`,
    sourceId: ID,
    title,
    description: truncate(excerpt),
    // The event page's date carries the year; the listing's year is inferred.
    startsAt: detail.startsAt ?? listing.startsAt,
    category: toCategory(room, title, excerpt),
    venue: { ...VENUE, address: room ? `${room}, ${VENUE.address}` : VENUE.address },
    isFree: price.isFree || /fri entré|gratis/i.test(`${listing.text} ${excerpt ?? ""}`),
    price: price.price,
    imageUrl: post?.yoast_head_json?.og_image?.[0]?.url ?? detail.image,
    url: listing.url,
    ticketUrl: detail.ticketUrl,
  };
}

async function fetchProgram(): Promise<MoriskaListing[]> {
  const listings: MoriskaListing[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = page === 1 ? PROGRAM_URL : `${PROGRAM_URL}page/${page}/`;
    let html: string;
    try {
      html = await fetchText(ID, url);
    } catch (err) {
      // Only the first page is required; a later one failing just shortens the window.
      if (page === 1) throw err;
      break;
    }
    // Later pages can repeat the upcoming list (the theme's "Older Entries" isn't strictly
    // paged), so keep only cards not seen yet and stop once a page adds nothing.
    const fresh = parseMoriskaProgram(html).filter((l) => {
      const key = `${normalizeUrl(l.url)}|${l.startsAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (fresh.length === 0) break;
    listings.push(...fresh);
    if (!hasNextPage(html, page)) break;
  }
  return listings;
}

/**
 * Moriska Paviljongen in Folkets Park. Its WordPress REST API exposes the
 * events (title, text, image) but not their dates, so dates come from the
 * public programme pages and the two are joined on the event link.
 */
async function getMoriskaEvents(): Promise<MalmoEvent[]> {
  const [listings, posts] = LIVE_MODE
    ? await Promise.all([fetchProgram(), fetchJson<MoriskaPost[]>(ID, API).catch(() => [])])
    : [parseMoriskaProgram(demoProgramHtml()), demoPosts()];
  const postsByUrl = new Map(posts.map((p) => [normalizeUrl(p.link), p]));
  const details = LIVE_MODE
    ? await mapLimit(listings, DETAIL_CONCURRENCY, (l, i) =>
        i >= MAX_DETAILS
          ? Promise.resolve<MoriskaDetail>({})
          : fetchDetailPage(ID, l.url)
          .then(parseMoriskaDetail)
          .catch((): MoriskaDetail => ({})),
      )
    : listings.map((l) => parseMoriskaDetail(demoDetailHtml(l)));
  return listings.map((l, i) => moriskaToEvent(l, postsByUrl.get(normalizeUrl(l.url)), details[i]));
}

export const moriska: EventSource = {
  id: ID,
  name: "Moriska Paviljongen",
  homepage: PROGRAM_URL,
  description:
    "Concerts, club nights and shows at Moriska Paviljongen: programme pages scraped with cheerio, joined with the WordPress REST API and enriched from each event page.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: PROGRAM_URL,
  demo: !LIVE_MODE,
  timeoutMs: 30000,
  fetchEvents: getMoriskaEvents,
};

function swedishDate(day: number) {
  const [, m, d] = malmoTime(day, "12:00").slice(0, 10).split("-").map(Number);
  const names = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  return `${String(d).padStart(2, "0")} ${names[m - 1]}`;
}

/** A programme page as the theme renders it (card per event, date without year). */
function demoProgramHtml() {
  const card = (slug: string, title: string, room: string, day: number, time: string) => `
    <article class="event-card">
      <a href="${SITE}/program/${slug}/">
        <h3>${title}</h3><span class="room">${room}</span>
        <span class="date">${swedishDate(day)}</span> <span class="time">${time}</span>
      </a>
    </article>`;
  return `<main>
    ${card("the-dating-pitch-club", "THE DATING PITCH CLUB", "", 1, "17.30")}
    ${card("common-ground-jazzclub", "COMMON GROUND JAZZCLUB: SVANTE SJÖBLOM", "Jazzklubb", 2, "20:00")}
    ${card("the-next-shit", "THE NEXT SHIT", "RedRoom", 2, "21:00")}
    ${card("eva-dahlgren", "EVA DAHLGREN", "", 8, "18:30")}
    ${card("the-halloween-party", "THE HALLOWEEN PARTY", "GrandFloor", 13, "23:00")}
    <a href="${SITE}/biljetter-program-2/page/2/">Older Entries</a>
  </main>`;
}

/** An event page as the theme renders it: full date with year, price and a Nortic link. */
function demoDetailHtml(listing: MoriskaListing) {
  const [ymd, time] = listing.startsAt.split("T");
  const [y, m, d] = ymd.split("-").map(Number);
  const months = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  return `<html><head><meta property="og:image" content="${SITE}/wp-content/uploads/demo.jpg"></head><body><main>
    <h1>${listing.heading}</h1>
    <p>${d} ${months[m - 1]} ${y} | ${time.slice(0, 5)}</p>
    <p>Pris: 295 kr + serviceavgift</p>
    <a href="https://nortic.se/ticket/event/81534">Köp biljett</a>
  </main></body></html>`;
}

function demoPosts(): MoriskaPost[] {
  const post = (slug: string, title: string, excerpt: string): MoriskaPost => ({
    link: `${SITE}/program/${slug}/`,
    title: { rendered: title },
    excerpt: { rendered: `<p>${excerpt}</p>` },
  });
  return [
    post("the-dating-pitch-club", "The Dating Pitch Club", "Vänner pitchar sina singelvänner på scen. Afterwork och mingel."),
    post("common-ground-jazzclub", "Common Ground Jazzclub: Svante Sjöblom", "Jazzklubb i Moriskans foajé med Svante Sjöbloms kvartett."),
    post("the-next-shit", "The Next Shit", "Nya band från Malmös musikscen, tre akter per kväll."),
    post("eva-dahlgren", "Eva Dahlgren", "Missa inte EVA DAHLGREN live på Moriska Paviljongen. Konsert med insläpp 18:30."),
    post("the-halloween-party", "The Halloween Party", "Utklädnad, DJ:s på två dansgolv och skräckfilmsbar."),
  ];
}
