import "server-only";

import { LIVE_MODE } from "../config";
import { malmoLocalToIso, malmoTime, malmoToday } from "../demo-dates";
import { decodeEntities, htmlToText, truncate } from "../html";
import { fetchJson, fetchText } from "../http";
import { toCategory } from "../map";
import type { EventSource, MalmoEvent } from "../types";

const ID = "moriska";
const SITE = "https://moriskapaviljongen.se";
const PROGRAM_URL = `${SITE}/biljetter-program-2/`;
const API = `${SITE}/wp-json/wp/v2/mp_event?per_page=100&_fields=link,title,excerpt,yoast_head_json`;
/** The programme lists 10 events per page; this covers a few months ahead. */
const MAX_PAGES = 6;

const VENUE = { name: "Moriska Paviljongen", address: "Norra Parkgatan 2", city: "Malmö", lat: 55.5932, lng: 13.0096 };

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

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

/** "09 oktober 17.30" → the next such date in Malmö time. Listings carry no year. */
const DATE_IN_TEXT = /(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|okt|nov|dec)\.?\s+(?:(\d{4})\s*\|?\s*)?(?:kl\.?\s*)?(\d{1,2})[.:](\d{2})/i;

function normalizeUrl(url: string) {
  return new URL(url, SITE).toString().replace(/\/+$/, "").toLowerCase();
}

function inferYear(month: number, day: number, today = malmoToday()) {
  const [y, m, d] = today.split("-").map(Number);
  // Anything more than a week in the past belongs to next year's programme.
  const candidate = Date.UTC(y, month - 1, day);
  return candidate < Date.UTC(y, m - 1, d - 7) ? y + 1 : y;
}

/**
 * Pull event cards out of a programme page. The theme's markup is not
 * documented, so this keys on what is stable: each card is a link to
 * /program/<slug>/ whose text holds a Swedish date and a time.
 */
export function parseMoriskaProgram(html: string, today?: string): MoriskaListing[] {
  const anchors = html.matchAll(/<a\b[^>]*\bhref=["']((?:https?:\/\/(?:www\.)?moriskapaviljongen\.se)?\/program\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const byUrl = new Map<string, MoriskaListing>();
  for (const [, href, inner] of anchors) {
    const text = htmlToText(inner);
    const match = text.match(DATE_IN_TEXT);
    if (!match) continue;
    const [, dayText, monthText, yearText, hour, minute] = match;
    const month = MONTHS.indexOf(monthText.slice(0, 3).toLowerCase()) + 1;
    const day = Number(dayText);
    if (month < 1 || day < 1 || day > 31) continue;
    const year = yearText ? Number(yearText) : inferYear(month, day, today);
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const url = new URL(href, SITE).toString();
    // The same slug is sometimes reused for two dates, so key on both.
    const startsAt = malmoLocalToIso(ymd, `${hour.padStart(2, "0")}:${minute}`);
    byUrl.set(`${normalizeUrl(url)}|${startsAt}`, {
      url,
      text,
      heading: text.slice(0, match.index).trim(),
      startsAt,
    });
  }
  return [...byUrl.values()];
}

/** True when the page links to a further page of the programme. */
export function hasNextPage(html: string, page: number) {
  return html.includes(`/page/${page + 1}/`);
}

export function moriskaToEvent(listing: MoriskaListing, post: MoriskaPost | undefined): MalmoEvent {
  const title = post ? decodeEntities(post.title.rendered).trim() : listing.heading || listing.text;
  const excerpt = post?.excerpt ? htmlToText(post.excerpt.rendered) : undefined;
  // What the card shows besides the title is the room (Jazzklubb, RedRoom, GrandFloor …).
  const heading = listing.heading.toLowerCase();
  const room = post && heading.startsWith(title.toLowerCase()) ? listing.heading.slice(title.length).trim() || undefined : undefined;
  return {
    id: `${ID}:${new URL(listing.url).pathname.replace(/^\/program\/|\/$/g, "")}@${listing.startsAt.slice(0, 16)}`,
    sourceId: ID,
    title,
    description: truncate(excerpt),
    startsAt: listing.startsAt,
    category: toCategory(room, title, excerpt),
    venue: { ...VENUE, address: room ? `${room}, ${VENUE.address}` : VENUE.address },
    isFree: /fri entré|gratis/i.test(`${listing.text} ${excerpt ?? ""}`),
    imageUrl: post?.yoast_head_json?.og_image?.[0]?.url,
    url: listing.url,
  };
}

async function fetchProgram(): Promise<MoriskaListing[]> {
  const listings: MoriskaListing[] = [];
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
    listings.push(...parseMoriskaProgram(html));
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
  return listings.map((l) => moriskaToEvent(l, postsByUrl.get(normalizeUrl(l.url))));
}

export const moriska: EventSource = {
  id: ID,
  name: "Moriska Paviljongen",
  homepage: PROGRAM_URL,
  description: "Concerts, club nights and shows at Moriska Paviljongen, scraped from the programme pages and joined with the WordPress REST API.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: PROGRAM_URL,
  demo: !LIVE_MODE,
  timeoutMs: 15000,
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
