import "server-only";

import { LIVE_MODE } from "../config";
import { daysFromTodayAt } from "../demo-dates";
import { decodeEntities, htmlToText, truncate } from "../html";
import { fetchText, SourceError } from "../http";
import { malmoLocalToIso } from "../malmo-time";
import type { EventSource, MalmoEvent } from "../types";

const ID = "spegeln";
const SITE = "https://biografspegeln.se";

const VENUE = { name: "Biograf Spegeln", address: "Stortorget 29", city: "Malmö", lat: 55.6054, lng: 13.0007 };

/** One film or show in the programme (`programList.features`). */
export interface SpegelnFeature {
  id: number;
  url: string;
  info: {
    title: string;
    /** HTML. */
    synopsis?: string;
    genres?: { name: string }[];
    /** "Barntillåten", "Från 15 år" … */
    ageLimit?: string;
    /** Minutes. */
    duration?: number;
    image?: { imageUrl?: string; crops?: { alias: string; url: string }[] };
  };
}

/** One screening (`programList.schedule[].dates[]`). */
export interface SpegelnScreening {
  /** Malmö local time without an offset, "2026-10-29T18:00:00.000". */
  startDate: string;
  ticksterLink?: string;
  soldOut?: boolean;
  /** The screen: "Alcazar", "Salong 2" … */
  saloonLabel?: string;
}

export interface SpegelnProgram {
  features: SpegelnFeature[];
  schedule: { featureId: number; dates: SpegelnScreening[] }[];
}

interface NextData {
  props?: { pageProps?: { programList?: SpegelnProgram } };
}

/** The home page carries the whole programme in its Next.js data. */
export function parseSpegelnProgram(html: string): SpegelnProgram {
  const json = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (!json) throw new SourceError(ID, "The page no longer carries its Next.js data");
  const program = (JSON.parse(json) as NextData).props?.pageProps?.programList;
  if (!program?.features || !program.schedule) throw new SourceError(ID, "The page data no longer lists the programme");
  return program;
}

/**
 * The CMS writes image URLs with its internal origin
 * ("http://localhost:8080/media/…"); the same path is served by the site.
 */
function imageUrl(image: SpegelnFeature["info"]["image"]) {
  const raw = image?.crops?.find((c) => c.alias === "card")?.url ?? image?.imageUrl;
  if (!raw) return undefined;
  try {
    const { pathname, search } = new URL(raw);
    return new URL(pathname + search, SITE).toString();
  } catch {
    return undefined;
  }
}

export function spegelnScreeningToEvent(feature: SpegelnFeature, screening: SpegelnScreening): MalmoEvent | undefined {
  const match = screening.startDate.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  const title = decodeEntities(feature.info.title).trim();
  if (!match || !title) return undefined;
  const [, day, time] = match;
  const startsAt = malmoLocalToIso(day, time);
  const minutes = feature.info.duration;
  const genres = (feature.info.genres ?? []).map((g) => g.name).join(" ");
  const screen = screening.saloonLabel?.trim();

  return {
    id: `${ID}:${feature.id}@${day}T${time}`,
    sourceId: ID,
    title,
    description: truncate(htmlToText(feature.info.synopsis ?? "")),
    startsAt,
    endsAt: minutes ? new Date(Date.parse(startsAt) + minutes * 60_000).toISOString() : undefined,
    category: /barn|familj/i.test(genres) ? "family" : "film",
    venue: { ...VENUE, address: screen ? `${screen}, ${VENUE.address}` : VENUE.address },
    isFree: false,
    imageUrl: imageUrl(feature.info.image),
    url: new URL(feature.url, SITE).toString(),
    ticketUrl: screening.ticksterLink || undefined,
    soldOut: screening.soldOut || undefined,
    notes: [screen, feature.info.ageLimit].filter((n): n is string => Boolean(n)),
  };
}

/**
 * Biograf Spegeln (cinema on Stortorget): every screening, one event each,
 * from the programme embedded in the home page. Tickets are sold through
 * Tickster, but the screenings are not on its Malmö listing.
 */
async function getSpegelnEvents(): Promise<MalmoEvent[]> {
  const program = parseSpegelnProgram(LIVE_MODE ? await fetchText(ID, SITE, { timeoutMs: 12_000 }) : demoHtml());
  const features = new Map(program.features.map((f) => [f.id, f]));
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  return program.schedule
    .flatMap(({ featureId, dates }) => {
      const feature = features.get(featureId);
      return feature ? dates.map((d) => spegelnScreeningToEvent(feature, d)) : [];
    })
    .filter((e): e is MalmoEvent => e !== undefined && Date.parse(e.endsAt ?? e.startsAt) >= cutoff);
}

export const spegeln: EventSource = {
  id: ID,
  name: "Biograf Spegeln",
  homepage: `${SITE}/program`,
  description: "Biograf Spegeln's screenings (films, sing-alongs, classics), from the programme data in its home page.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: SITE,
  demo: !LIVE_MODE,
  fetchEvents: getSpegelnEvents,
};

/** A home page with two films in the site's Next.js data, dated from today. */
function demoHtml() {
  const local = (day: number, time: string) => `${daysFromTodayAt(day, time).slice(0, 16)}:00.000`;
  const program: SpegelnProgram = {
    features: [
      {
        id: 1,
        url: `${SITE}/program/fjord`,
        info: { title: "Fjord", synopsis: "<p>Vinnare av Guldpalmen i Cannes.</p>", genres: [{ name: "Drama" }], ageLimit: "Från 11 år", duration: 146 },
      },
      {
        id: 2,
        url: `${SITE}/program/molly-monster`,
        info: { title: "Molly Monster", genres: [{ name: "Barnfilm" }], ageLimit: "Barntillåten", duration: 72 },
      },
    ],
    schedule: [
      { featureId: 1, dates: [{ startDate: local(1, "18:00"), saloonLabel: "Alcazar" }, { startDate: local(3, "20:30"), saloonLabel: "Salong 2" }] },
      { featureId: 2, dates: [{ startDate: local(2, "13:00"), saloonLabel: "Salong 3" }] },
    ],
  };
  return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { programList: program } } })}</script>`;
}
