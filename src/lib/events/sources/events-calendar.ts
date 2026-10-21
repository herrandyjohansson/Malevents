import "server-only";

import { LIVE_MODE } from "../config";
import { daysFromTodayAt } from "../demo-dates";
import { decodeEntities, htmlToText, truncate } from "../html";
import { fetchJson } from "../http";
import { parsePriceText, toCategory } from "../normalize";
import type { EventCategory, EventSource, MalmoEvent, SourceReport } from "../types";

/** Pages read at most; The Events Calendar returns up to 50 events per page. */
const MAX_PAGES = 6;
const PER_PAGE = 50;

/** One event from The Events Calendar's REST API (`/wp-json/tribe/events/v1/events`). Only the fields read here. */
export interface TribeEvent {
  id: number;
  title: string;
  excerpt?: string;
  url: string;
  /** "2026-10-21 15:30:00", in UTC. */
  utc_start_date: string;
  utc_end_date?: string;
  all_day?: boolean;
  cost?: string;
  image?: { url?: string } | false;
  categories?: { name: string }[];
}

interface TribePage {
  events: TribeEvent[];
  total_pages?: number;
}

export interface EventsCalendarOptions {
  id: string;
  name: string;
  /** Site root, e.g. "https://malmokonsthall.se". */
  site: string;
  homepage: string;
  description: string;
  /** Every event is at this venue; the plugin's own venue field is often empty. */
  venue: { name: string; address?: string; lat: number; lng: number };
  /** The site's category names (lower case) matched to ours before keywords. */
  categories?: Record<string, EventCategory>;
  /** For events whose category says nothing more specific. */
  fallback: EventCategory;
  demo: () => TribeEvent[];
}

function utc(value: string) {
  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

/**
 * A source for any WordPress site running The Events Calendar plugin, which
 * publishes a paged JSON API of upcoming events. Each site gets its own id
 * and venue; see malmo-konsthall.ts.
 */
export function eventsCalendarSource(options: EventsCalendarOptions): EventSource {
  const { id, site, venue } = options;
  const endpoint = `${site}/wp-json/tribe/events/v1/events`;

  function category(e: TribeEvent): EventCategory {
    for (const c of e.categories ?? []) {
      const hit = options.categories?.[c.name.toLowerCase()];
      if (hit) return hit;
    }
    const guess = toCategory(...(e.categories ?? []).map((c) => c.name), e.title);
    return guess === "other" ? options.fallback : guess;
  }

  function toEvent(e: TribeEvent): MalmoEvent {
    const description = truncate(htmlToText(e.excerpt ?? ""));
    return {
      id: `${id}:${e.id}`,
      sourceId: id,
      title: decodeEntities(e.title).trim(),
      description,
      startsAt: utc(e.utc_start_date),
      endsAt: e.utc_end_date ? utc(e.utc_end_date) : undefined,
      timeUnknown: e.all_day ? true : undefined,
      category: category(e),
      venue: { name: venue.name, address: venue.address, city: "Malmö", lat: venue.lat, lng: venue.lng },
      ...parsePriceText(e.cost || description),
      imageUrl: (e.image && e.image.url) || undefined,
      url: e.url,
    };
  }

  async function fetchAll(report: SourceReport) {
    const events: TribeEvent[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const data = await fetchJson<TribePage>(id, `${endpoint}?per_page=${PER_PAGE}&page=${page}`);
        events.push(...(data.events ?? []));
        if (!data.total_pages || page >= data.total_pages) return events;
      } catch (err) {
        if (page === 1) throw err;
        report.warn(`Page ${page} of the events API failed, so later events are missing`);
        return events;
      }
    }
    report.warn(`Only the first ${MAX_PAGES * PER_PAGE} events are read`);
    return events;
  }

  return {
    id,
    name: options.name,
    homepage: options.homepage,
    description: options.description,
    kind: LIVE_MODE ? "json-api" : "fixture",
    endpoint,
    demo: !LIVE_MODE,
    fetchEvents: async (report) => (LIVE_MODE ? await fetchAll(report) : options.demo()).map(toEvent),
  };
}

/** A demo event in the API's shape, `day` days from today at `time` Malmö time. */
export function demoTribeEvent(
  id: number,
  title: string,
  day: number,
  time: string,
  hours: number,
  category: string,
  url: string,
): TribeEvent {
  const start = new Date(daysFromTodayAt(day, time));
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  return { id, title, url, utc_start_date: fmt(start), utc_end_date: fmt(end), categories: [{ name: category }] };
}
