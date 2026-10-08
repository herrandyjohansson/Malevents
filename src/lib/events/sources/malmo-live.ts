import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { LIVE_MODE } from "../config";
import { malmoTime } from "../demo-dates";
import { fetchJsonLdEvents, jsonLdToEvent, type JsonLdEvent } from "../jsonld";
import type { EventSource, MalmoEvent } from "../types";

const ID = "malmo-live";
const PAGE_URL = "https://malmolive.se/";

/**
 * Venue sites often expose schema.org Event JSON-LD. In live mode this
 * adapter reads it from the venue's own pages; otherwise it serves fixtures
 * in the same shape.
 */
async function getMalmoLiveEvents(): Promise<MalmoEvent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("events", `events:${ID}`);

  const events = LIVE_MODE ? await fetchJsonLdEvents(ID, PAGE_URL) : demoEvents();
  return events.map((e) => jsonLdToEvent(ID, PAGE_URL, e));
}

export const malmoLive: EventSource = {
  id: ID,
  name: "Malmö Live",
  homepage: PAGE_URL,
  demo: !LIVE_MODE,
  fetchEvents: getMalmoLiveEvents,
};

function demoEvents(): JsonLdEvent[] {
  const location = {
    name: "Malmö Live Konserthus",
    address: { streetAddress: "Dag Hammarskjölds torg 4", addressLocality: "Malmö" },
  };
  return [
    {
      "@type": "MusicEvent",
      "@id": "mso-brahms",
      name: "Malmö SymfoniOrkester: Brahms 4",
      description: "MSO spelar Brahms fjärde symfoni under chefdirigentens ledning.",
      startDate: malmoTime(1, "19:00"),
      endDate: malmoTime(1, "21:00"),
      location,
      offers: { lowPrice: 150, highPrice: 420, priceCurrency: "SEK" },
      url: PAGE_URL,
    },
    {
      "@type": "MusicEvent",
      "@id": "lunch-chamber",
      name: "Lunchkonsert: Stråkkvartett",
      description: "45 minuter kammarmusik mitt på dagen.",
      startDate: malmoTime(4, "12:00"),
      endDate: malmoTime(4, "12:45"),
      location,
      offers: { price: 120, priceCurrency: "SEK" },
      url: PAGE_URL,
    },
    {
      "@type": "TheaterEvent",
      "@id": "standup-night",
      name: "Stand-up Night Malmö",
      description: "Fyra komiker från Skåne och Köpenhamn.",
      startDate: malmoTime(6, "20:00"),
      location,
      offers: { price: 295, priceCurrency: "SEK" },
      url: PAGE_URL,
    },
    {
      "@type": "ChildrensEvent",
      "@id": "family-concert",
      name: "Familjekonsert: Peter och vargen",
      description: "Orkestersaga för hela familjen, från 4 år.",
      startDate: malmoTime(7, "14:00"),
      location,
      offers: { price: 0, priceCurrency: "SEK" },
      url: PAGE_URL,
    },
    {
      "@type": "MusicEvent",
      "@id": "jazz-big-band",
      name: "Big Band-kväll med Malmö Jazz Orchestra",
      startDate: malmoTime(11, "19:30"),
      location,
      offers: { lowPrice: 200, highPrice: 350, priceCurrency: "SEK" },
      url: PAGE_URL,
    },
  ];
}
