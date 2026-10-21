import "server-only";

import { addDays } from "@/lib/days";

import { LIVE_MODE } from "../config";
import { decodeEntities } from "../html";
import { fetchText, SourceError } from "../http";
import { malmoLocalToIso, malmoToday } from "../malmo-time";
import { toCategory } from "../normalize";
import type { EventSource, MalmoEvent } from "../types";

const ID = "plan-b";
const SITE = "https://www.planbmalmo.com";

const VENUE = { name: "Plan B", address: "Norra Grängesbergsgatan 26B", lat: 55.5839, lng: 13.0272 };

/** Other venues the site sometimes promotes ("Sara Parkman - LIVE på Moriska Paviljongen"); those are left out. */
const ELSEWHERE = /\b(på|at)\s+(moriska|babel|grand|slagthuset|malmö live|inkonst|folkets park|palladium|kb\b)/i;

/** One featured item from the page's Next.js data (`venueData.siteSettings.heroContent`). */
export interface PlanBItem {
  objectId: string;
  type: string;
  title: string;
  /** The date as "dd/mm/yy", sometimes with a trailing space. */
  info: string;
  image?: string;
  /** Site-relative event page, "terra/sVB45xqy3e". */
  link?: string;
  ticketLink?: string;
}

interface NextData {
  props?: { pageProps?: { venueData?: { siteSettings?: { heroContent?: PlanBItem[] } } } };
}

/** "11/12/26" → "2026-12-11". */
function ymd(info: string) {
  const m = info.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  return m ? `20${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : undefined;
}

export function planBItemToEvent(item: PlanBItem, today: string): MalmoEvent | undefined {
  const day = ymd(item.info);
  const title = decodeEntities(item.title).trim();
  if (item.type !== "event" || !day || day < today || !title || ELSEWHERE.test(title)) return undefined;
  const guess = toCategory(title);
  return {
    id: `${ID}:${item.objectId}`,
    sourceId: ID,
    title,
    startsAt: malmoLocalToIso(day, "00:00"),
    // The site publishes the day only; doors and start times are on the ticket page.
    timeUnknown: true,
    category: guess === "other" ? "music" : guess,
    venue: { name: VENUE.name, address: VENUE.address, city: "Malmö", lat: VENUE.lat, lng: VENUE.lng },
    isFree: false,
    imageUrl: item.image,
    url: item.link ? `${SITE}/${item.link}` : SITE,
    ticketUrl: item.ticketLink,
  };
}

/**
 * Plan B (club and live venue in Sofielund). The site runs on a platform
 * that loads the full programme in the browser; the server-rendered page
 * only carries the featured events, so this source lists those: the
 * venue's highlighted gigs and club nights, by day, without start times.
 */
async function getPlanBEvents(): Promise<MalmoEvent[]> {
  const items = LIVE_MODE ? await fetchItems() : demoItems();
  const today = malmoToday();
  return items.map((item) => planBItemToEvent(item, today)).filter((e): e is MalmoEvent => e !== undefined);
}

async function fetchItems() {
  const html = await fetchText(ID, SITE);
  const json = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (!json) throw new SourceError(ID, "The page no longer carries its Next.js data");
  const items = (JSON.parse(json) as NextData).props?.pageProps?.venueData?.siteSettings?.heroContent;
  if (!items) throw new SourceError(ID, "The page data no longer lists featured events");
  return items;
}

export const planB: EventSource = {
  id: ID,
  name: "Plan B",
  homepage: SITE,
  description: "Plan B's featured gigs and club nights (by day, no start times), from the data in its home page.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: SITE,
  demo: !LIVE_MODE,
  fetchEvents: getPlanBEvents,
};

/** Featured items in the page's shape, dated from today. */
function demoItems(): PlanBItem[] {
  const info = (days: number) => {
    const [y, m, d] = addDays(malmoToday(), days).split("-");
    return `${d}/${m}/${y.slice(2)} `;
  };
  return [
    { objectId: "demo1", type: "event", title: "Terra", info: info(5), link: "terra/demo1", ticketLink: "https://nortic.se/" },
    { objectId: "demo2", type: "event", title: "Jonas Lundqvist", info: info(9), link: "jonas-lundqvist/demo2" },
  ];
}
