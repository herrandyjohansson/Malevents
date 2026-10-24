import "server-only";

import { LIVE_MODE } from "../config";
import { daysFromTodayAt } from "../demo-dates";
import { decodeEntities, htmlToText, truncate } from "../html";
import { fetchJson } from "../http";
import { malmoLocalToIso } from "../malmo-time";
import type { EventSource, MalmoEvent } from "../types";

const ID = "panora";
const SITE = "https://panora.se";
/** Folkets Bio's booking site; Panora's own programme page links each screening there. */
const BIO = "https://bio.se";
const API = `${BIO}/api/cinemas/films`;
/** Panora's id on bio.se (from `/api/cinemas/slug/panora-folkets-bio-malmo`). */
const CINEMA_ID = 2128;

const VENUE = { name: "Panora", address: "Friisgatan 19D", city: "Malmö", lat: 55.5921, lng: 13.0057 };

/** One film and its screenings from bio.se's `/api/cinemas/films`. Every value is a string. */
export interface BioFilm {
  movie: {
    id: number;
    title: string;
    /** HTML with its tags entity-encoded ("&lt;br&gt;"). */
    synopsis?: string;
    /** Comma-separated: "Barnfilm,Animerad film". */
    genre?: string;
    poster_url?: string;
    /** Minutes, "0" when unknown. */
    run_time?: string;
    /** "Från 11 år", "Barntillåten", "Ej angivet". */
    rating?: string;
  };
  sessions: {
    id: string;
    /** Malmö local time without an offset, "2026-10-24T19:30:00". */
    show_date_time: string;
    /** "/bokning/cinemaId/2128/sessionId/1094" */
    payment_link?: string;
    screen_name?: string;
    /** Subtitles: "Svenska". */
    text?: string;
  }[];
}

export function panoraSessionToEvent(film: BioFilm, session: BioFilm["sessions"][number]): MalmoEvent | undefined {
  const match = session.show_date_time.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  const title = decodeEntities(film.movie.title).trim();
  if (!match || !title) return undefined;
  const [, day, time] = match;
  const startsAt = malmoLocalToIso(day, time);
  const minutes = Number(film.movie.run_time);
  const screen = session.screen_name?.trim();
  const rating = film.movie.rating && film.movie.rating !== "Ej angivet" ? film.movie.rating : undefined;

  return {
    id: `${ID}:${session.id}`,
    sourceId: ID,
    title,
    description: truncate(htmlToText(decodeEntities(film.movie.synopsis ?? ""))),
    startsAt,
    endsAt: minutes > 0 ? new Date(Date.parse(startsAt) + minutes * 60_000).toISOString() : undefined,
    category: /barn|familj/i.test(film.movie.genre ?? "") ? "family" : "film",
    venue: { ...VENUE, address: screen ? `${screen}, ${VENUE.address}` : VENUE.address },
    isFree: false,
    imageUrl: film.movie.poster_url || undefined,
    url: `${SITE}/program/`,
    ticketUrl: session.payment_link ? new URL(session.payment_link, BIO).toString() : undefined,
    notes: [screen, rating, session.text ? `Text: ${session.text}` : undefined].filter((n): n is string => Boolean(n)),
  };
}

/**
 * Panora (Folkets Bio's cinema on Möllan): every screening, including the
 * children's matinées, from the bio.se booking API its programme page uses.
 * The API only answers POST. Talks and workshops on panora.se are not in it.
 */
async function getPanoraEvents(): Promise<MalmoEvent[]> {
  const films = LIVE_MODE
    ? (await fetchJson<{ movies: BioFilm[] }>(ID, API, { body: { cinemaId: CINEMA_ID }, timeoutMs: 12_000 })).movies
    : demoFilms();
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  return films
    .flatMap((film) => film.sessions.map((s) => panoraSessionToEvent(film, s)))
    .filter((e): e is MalmoEvent => e !== undefined && Date.parse(e.endsAt ?? e.startsAt) >= cutoff);
}

export const panora: EventSource = {
  id: ID,
  name: "Panora",
  homepage: `${SITE}/program/`,
  description: "Panora's screenings, children's films included, from the bio.se booking API behind its programme.",
  kind: LIVE_MODE ? "json-api" : "fixture",
  endpoint: API,
  demo: !LIVE_MODE,
  fetchEvents: getPanoraEvents,
};

/** Two films in the API's shape, dated from today. */
function demoFilms(): BioFilm[] {
  const local = (day: number, time: string) => daysFromTodayAt(day, time).slice(0, 16) + ":00";
  return [
    {
      movie: { id: 1, title: "Fjord", synopsis: "Vinnare av Guldpalmen&lt;br&gt;Ett drama.", genre: "Drama", run_time: "146", rating: "Från 11 år" },
      sessions: [{ id: "demo-1", show_date_time: local(1, "19:30"), payment_link: "/bokning/cinemaId/2128/sessionId/1", screen_name: "Salong 3", text: "Svenska" }],
    },
    {
      movie: { id: 2, title: "Molly Monster", genre: "Barnfilm,Animerad film", run_time: "72", rating: "Barntillåten" },
      sessions: [{ id: "demo-2", show_date_time: local(2, "12:15"), payment_link: "/bokning/cinemaId/2128/sessionId/2", screen_name: "Salong 2" }],
    },
  ];
}
