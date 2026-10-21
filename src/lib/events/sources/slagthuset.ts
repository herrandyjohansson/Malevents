import "server-only";

import { LIVE_MODE } from "../config";
import { daysFromTodayAt } from "../demo-dates";
import { malmoLocalToIso } from "../malmo-time";
import { decodeEntities, htmlToText, truncate } from "../html";
import { fetchJson } from "../http";
import { parsePriceText, toCategory } from "../normalize";
import type { EventSource, MalmoEvent, SourceReport } from "../types";

const ID = "slagthuset";
const SITE = "https://slagthuset.se";
const API = "https://wp.slagthuset.se/wp-json/wp/v2/events";
const FIELDS = "id,link,title,acf,event_medium";
/** The API orders by publish date, newest first, so upcoming events sit on the first pages. */
const PAGES = 4;
const PER_PAGE = 100;

interface Term {
  name: string;
  slug: string;
}

/** The headless WordPress behind slagthuset.se: an `events` post type with ACF fields. */
export interface SlagthusetPost {
  id: number;
  link: string;
  title: { rendered: string };
  event_medium?: { url: string } | false;
  acf: {
    /** YYYYMMDD */
    startdatum: string;
    slutdatum?: string;
    /** HH:mm; doors are `oppnar`, the show is `borjar`. */
    oppnar?: string;
    borjar?: string;
    slutar?: string;
    /** Room in the building: Teatern, Kafé Slagthuset … */
    plats?: Term[] | false;
    status?: Term | false;
    /** Free text, e.g. "595 kr". */
    pris?: string;
    biljettlank?: string;
    underrubrik?: string;
    lang_info?: string;
    /** e.g. "13 år" */
    aldersgrans?: string;
    typ_av_evenemang?: Term | false;
    gom_i_kalender?: boolean;
  };
}

const VENUE = { name: "Slagthuset", address: "Jörgen Kocksgatan 7A", city: "Malmö", lat: 55.6094, lng: 13.0052 };

function ymd(compact: string) {
  return /^\d{8}$/.test(compact) ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}` : undefined;
}

function hm(time: string | undefined) {
  const match = time?.match(/^(\d{1,2})[:.](\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : undefined;
}

export function slagthusetPostToEvent(post: SlagthusetPost): MalmoEvent | undefined {
  const { acf } = post;
  const startDay = ymd(acf.startdatum);
  if (!startDay || acf.gom_i_kalender) return undefined;

  const status = acf.status ? acf.status.name : "";
  if (/inställ|cancel/i.test(status)) return undefined;

  const endDay = ymd(acf.slutdatum ?? "") ?? startDay;
  const endTime = hm(acf.slutar);
  const room = acf.plats ? acf.plats[0]?.name : undefined;
  const type = acf.typ_av_evenemang ? acf.typ_av_evenemang.name : undefined;
  const startTime = hm(acf.borjar) ?? hm(acf.oppnar);
  const title = decodeEntities(post.title.rendered).trim();
  const subtitle = acf.underrubrik ? decodeEntities(acf.underrubrik).trim() : "";
  const body = acf.lang_info ? htmlToText(acf.lang_info) : "";
  const description = truncate([subtitle, body].filter(Boolean).join(". "));

  return {
    id: `${ID}:${post.id}`,
    sourceId: ID,
    title,
    description,
    startsAt: malmoLocalToIso(startDay, startTime ?? "00:00"),
    timeUnknown: startTime ? undefined : true,
    endsAt: endTime ? malmoLocalToIso(endDay, endTime) : undefined,
    category: toCategory(type, title),
    venue: { ...VENUE, address: room ? `${room}, ${VENUE.address}` : VENUE.address },
    ...parsePriceText(acf.pris),
    imageUrl: post.event_medium ? post.event_medium.url : undefined,
    url: post.link || SITE,
    ticketUrl: acf.biljettlank || undefined,
    soldOut: /utsål|slutsål/i.test(status) || undefined,
    notes: [
      room,
      hm(acf.oppnar) ? `Insläpp ${hm(acf.oppnar)}` : undefined,
      acf.aldersgrans ? `Åldersgräns ${acf.aldersgrans}` : undefined,
    ].filter((n): n is string => Boolean(n)),
  };
}

/**
 * Page by page, stopping at the first short page. Asking for pages past the
 * last one makes WordPress answer HTTP 400, which used to log a warning for
 * every refresh even though nothing was wrong.
 */
async function fetchPosts(report: SourceReport): Promise<SlagthusetPost[]> {
  const posts: SlagthusetPost[] = [];
  for (let page = 1; page <= PAGES; page++) {
    let batch: SlagthusetPost[];
    try {
      batch = await fetchJson<SlagthusetPost[]>(ID, `${API}?per_page=${PER_PAGE}&page=${page}&_fields=${FIELDS}`);
    } catch (err) {
      if (page === 1) throw err;
      report.warn(`Page ${page} of the events API failed, so later events are missing`);
      break;
    }
    posts.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return posts;
}

/**
 * Slagthuset (concerts, comedy, club nights). The public site is a Next.js
 * front end over a headless WordPress whose REST API is open, so this reads
 * structured JSON rather than scraping pages.
 */
async function getSlagthusetEvents(report: SourceReport): Promise<MalmoEvent[]> {
  const posts = LIVE_MODE ? await fetchPosts(report) : demoPosts();
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  return posts
    .map(slagthusetPostToEvent)
    .filter((e): e is MalmoEvent => e !== undefined && Date.parse(e.endsAt ?? e.startsAt) >= cutoff);
}

export const slagthuset: EventSource = {
  id: ID,
  name: "Slagthuset",
  homepage: `${SITE}/events`,
  description: "Concerts, comedy and club nights at Slagthuset, from the venue's open WordPress REST API.",
  kind: LIVE_MODE ? "json-api" : "fixture",
  endpoint: `${API}?per_page=100&_fields=${FIELDS}`,
  demo: !LIVE_MODE,
  fetchEvents: getSlagthusetEvents,
};

/** Posts in the shape the API returns, with dates kept upcoming. */
function demoPosts(): SlagthusetPost[] {
  const compact = (day: number) => daysFromTodayAt(day, "12:00").slice(0, 10).replaceAll("-", "");
  const term = (name: string): Term => ({ name, slug: name.toLowerCase() });
  const post = (id: number, slug: string, title: string, day: number, acf: Partial<SlagthusetPost["acf"]>): SlagthusetPost => ({
    id,
    link: `${SITE}/events/${slug}/`,
    title: { rendered: title },
    event_medium: false,
    acf: { startdatum: compact(day), plats: [term("Teatern")], status: term("Aktivt"), ...acf },
  });
  return [
    post(7919, "nazareth", "Nazareth", 3, {
      oppnar: "18:00",
      borjar: "19:30",
      pris: "595 kr",
      lang_info: "<p>Skotska rocklegendarerna på <strong>Right, Left &amp; Centre Tour 2026</strong>.</p>",
      typ_av_evenemang: term("Musik"),
      biljettlank: "https://secure.tickster.com/jettn6l321vnv5c",
    }),
    post(7904, "brandsta-city-slackers", "Brandsta City Släckers", 5, {
      oppnar: "13:00",
      borjar: "14:00",
      pris: "350 kr",
      underrubrik: "Familjekonsert",
      typ_av_evenemang: term("Musik"),
    }),
    post(7898, "stephen-lynch-the-me-tour", "Stephen Lynch &#8211; The Me Tour", 9, {
      oppnar: "19:00",
      borjar: "20:00",
      pris: "450 kr",
      typ_av_evenemang: term("Stand-up"),
    }),
    post(7910, "lisa-ekdahl", "Lisa Ekdahl", 12, {
      oppnar: "18:30",
      borjar: "20:00",
      pris: "640 kr",
      typ_av_evenemang: term("Musik"),
      status: term("Utsålt"),
    }),
  ];
}
