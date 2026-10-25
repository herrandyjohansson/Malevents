import "server-only";

import { addDays } from "@/lib/days";

import { LIVE_MODE } from "../config";
import { daysFromTodayAt } from "../demo-dates";
import { decodeEntities, truncate } from "../html";
import { fetchText, SourceError } from "../http";
import { malmoLocalToIso, malmoToday } from "../malmo-time";
import { parsePriceText, toCategory } from "../normalize";
import { embeddedJsonArray } from "../scrape";
import type { EventCategory, EventSource, MalmoEvent, SourceReport } from "../types";

const ID = "malmo-stad";
const SITE = "https://malmo.se";
const LISTING = `${SITE}/evenemang`;
/** How far ahead to read; the city lists few events beyond about three months. */
const DAYS_AHEAD = 90;
/** Most items one request returns; reaching it means the window was cut short. */
const MAX_ITEMS = 1000;

/**
 * One item of the listing data malmo.se embeds in its event pages (the
 * Sitevision app behind "Evenemang i Malmö"). Only the fields read here.
 */
export interface MalmoStadItem {
  id: string;
  title: string;
  desc?: string;
  image?: string;
  /** Site-relative event page. */
  url: string;
  categories?: string[];
  place?: string[];
  targetGroups?: string[];
  dates?: {
    /** "16:30 – 17:30", or empty when the event has no set time. */
    time?: string;
    /**
     * Start and end as epoch milliseconds holding Malmö wall-clock time as
     * if it were UTC: an event shown at 19:30 has 19:30Z. See `wallClockToIso`.
     */
    sortDateTime?: number;
    endSortDateTime?: number;
    isSingleDay?: boolean;
    room?: string[];
  };
}

/** The calendar's own categories, matched to ours before falling back to keywords. */
const CATEGORIES: Record<string, EventCategory> = {
  konsert: "music",
  musik: "music",
  "teater och scenkonst": "theatre",
  dans: "theatre",
  utställning: "art",
  konst: "art",
  film: "film",
  samtal: "talks",
  föreläsning: "talks",
  litteratur: "talks",
  workshop: "talks",
  visning: "talks",
  idrott: "sports",
  "mat och dryck": "food",
};

function category(item: MalmoStadItem): EventCategory {
  // Children's events are what families look for, whatever the art form.
  if (item.targetGroups?.includes("Barn och familj")) return "family";
  for (const c of item.categories ?? []) {
    const hit = CATEGORIES[c.toLowerCase()];
    if (hit) return hit;
  }
  return toCategory(...(item.categories ?? []), item.title);
}

/**
 * The calendar's epochs are wall-clock time written as UTC (checked against
 * the displayed `date` and `time` of every item on 24 Oct 2026), so reading
 * them as real instants put every event one or two hours late.
 */
function wallClockToIso(ms: number) {
  const utc = new Date(ms).toISOString();
  return malmoLocalToIso(utc.slice(0, 10), utc.slice(11, 16));
}

export function malmoStadItemToEvent(item: MalmoStadItem): MalmoEvent | undefined {
  const start = item.dates?.sortDateTime;
  if (!item.id || !item.title || !start) return undefined;
  const end = item.dates?.endSortDateTime;
  const description = truncate(decodeEntities(item.desc ?? "").trim());
  const place = item.place?.[0]?.trim();
  return {
    id: `${ID}:${item.id}@${start}`,
    sourceId: ID,
    title: decodeEntities(item.title).trim(),
    description,
    startsAt: wallClockToIso(start),
    endsAt: end && end > start ? wallClockToIso(end) : undefined,
    // Multi-day items (exhibitions, recurring series) are date ranges; only a single day without a time is "time not announced".
    timeUnknown: !item.dates?.time && item.dates?.isSingleDay !== false ? true : undefined,
    category: category(item),
    venue: place ? { name: place, city: "Malmö" } : undefined,
    ...parsePriceText(description),
    imageUrl: item.image,
    url: new URL(item.url, SITE).toString(),
    notes: item.dates?.room?.filter(Boolean).length ? item.dates.room : undefined,
  };
}

/**
 * Malmö stad's public event calendar: city libraries, museums, Folkets Park,
 * Kulturskolan and outside organisers. The listing page embeds its data as
 * JSON, and takes a date range and a page size, so one request reads the
 * next DAYS_AHEAD days.
 */
async function getMalmoStadEvents(report: SourceReport): Promise<MalmoEvent[]> {
  const items = LIVE_MODE ? await fetchItems(report) : demoItems();
  return items.map(malmoStadItemToEvent).filter((e): e is MalmoEvent => e !== undefined);
}

async function fetchItems(report: SourceReport) {
  const today = malmoToday();
  const url = `${LISTING}?startDate=${today}&endDate=${addDays(today, DAYS_AHEAD)}&num=${MAX_ITEMS}`;
  const items = embeddedJsonArray<MalmoStadItem>(await fetchText(ID, url, { timeoutMs: 15000 }), "items");
  if (!items) throw new SourceError(ID, "The calendar page no longer embeds its listing data");
  if (items.length >= MAX_ITEMS) report.warn(`Read the first ${MAX_ITEMS} events; later ones in the window are missing`);
  return items;
}

export const malmoStad: EventSource = {
  id: ID,
  name: "Malmö stad",
  homepage: LISTING,
  description: "The city's event calendar: libraries, museums, Folkets Park, Kulturskolan and outside organisers.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: LISTING,
  demo: !LIVE_MODE,
  aggregator: true,
  timeoutMs: 15000,
  fetchEvents: getMalmoStadEvents,
};

/** Items in the shape the page embeds, with dates kept upcoming. */
function demoItems(): MalmoStadItem[] {
  // Wall-clock time written as UTC, like the live calendar (see `wallClockToIso`).
  const at = (day: number, time: string) => Date.parse(`${daysFromTodayAt(day, time).slice(0, 16)}Z`);
  return [
    {
      id: "5.demo1",
      title: "Sagostund på Stadsbiblioteket",
      desc: "Högläsning för barn 3–6 år i Barnens bibliotek. Fri entré.",
      url: "/Uppleva-och-gora/Evenemang/Evenemang-i-Malmo/Evenemangssida.html?id=5.demo1",
      categories: ["Litteratur"],
      place: ["Stadsbiblioteket"],
      targetGroups: ["Barn och familj"],
      dates: { time: "10:30 – 11:15", sortDateTime: at(0, "10:30"), endSortDateTime: at(0, "11:15"), isSingleDay: true },
    },
    {
      id: "5.demo2",
      title: "Visning: Malmöhus genom tiderna",
      desc: "En guidad visning genom slottets historia.",
      url: "/Uppleva-och-gora/Evenemang/Evenemang-i-Malmo/Evenemangssida.html?id=5.demo2",
      categories: ["Visning"],
      place: ["Malmö museum"],
      targetGroups: [],
      dates: { time: "13:00 – 14:00", sortDateTime: at(2, "13:00"), endSortDateTime: at(2, "14:00"), isSingleDay: true },
    },
    {
      id: "5.demo3",
      title: "Konsert: Malmö Kulturskolas höstkonsert",
      desc: "Elever spelar och sjunger. Gratis.",
      url: "/Uppleva-och-gora/Evenemang/Evenemang-i-Malmo/Evenemangssida.html?id=5.demo3",
      categories: ["Konsert"],
      place: ["Folkets Park"],
      targetGroups: [],
      dates: { time: "18:00 – 19:30", sortDateTime: at(4, "18:00"), endSortDateTime: at(4, "19:30"), isSingleDay: true },
    },
  ];
}
