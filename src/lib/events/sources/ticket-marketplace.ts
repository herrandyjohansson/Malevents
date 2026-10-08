import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { malmoTime } from "../demo-dates";
import { toCategory } from "../map";
import type { EventSource, MalmoEvent } from "../types";

const ID = "ticket-marketplace";

/**
 * Upstream shape modelled on the nested JSON that keyed ticketing APIs
 * return (embedded venues, classification trees, price ranges). A real
 * adapter would pass its API key from process.env via fetchJson headers.
 */
interface TicketMarketplaceResponse {
  _embedded: {
    events: {
      id: string;
      name: string;
      info?: string;
      url: string;
      dates: { start: { dateTime: string } };
      classifications: { segment: { name: string }; genre?: { name: string } }[];
      priceRanges?: { min: number; max: number; currency: string }[];
      _embedded: { venues: { name: string; address?: { line1: string }; city?: { name: string } }[] };
    }[];
  };
}

async function getTicketMarketplaceEvents(): Promise<MalmoEvent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("events", `events:${ID}`);

  const data = demoResponse();
  return data._embedded.events.map((e): MalmoEvent => {
    const venue = e._embedded.venues[0];
    const range = e.priceRanges?.[0];
    const c = e.classifications[0];
    return {
      id: `${ID}:${e.id}`,
      sourceId: ID,
      title: e.name,
      description: e.info,
      startsAt: e.dates.start.dateTime,
      category: toCategory(c?.segment.name, c?.genre?.name),
      venue: venue && { name: venue.name, address: venue.address?.line1, city: venue.city?.name },
      isFree: range ? range.max === 0 : false,
      price: range && range.max > 0 ? range : undefined,
      url: e.url,
    };
  });
}

export const ticketMarketplace: EventSource = {
  id: ID,
  name: "Ticket marketplace",
  homepage: "https://malmoarena.com/",
  demo: true,
  fetchEvents: getTicketMarketplaceEvents,
};

function demoResponse(): TicketMarketplaceResponse {
  const arena = {
    name: "Malmö Arena",
    address: { line1: "Hyllie Stationstorg 2" },
    city: { name: "Malmö" },
  };
  const url = "https://malmoarena.com/";
  return {
    _embedded: {
      events: [
        {
          id: "tm-01",
          name: "Malmö Redhawks – Frölunda HC",
          info: "SHL, grundserien.",
          url,
          dates: { start: { dateTime: malmoTime(2, "19:00") } },
          classifications: [{ segment: { name: "Sports" }, genre: { name: "Hockey" } }],
          priceRanges: [{ min: 195, max: 545, currency: "SEK" }],
          _embedded: { venues: [arena] },
        },
        {
          id: "tm-02",
          name: "Arena Pop Tour 2026",
          info: "Stor popkonsert med specialgäster.",
          url,
          dates: { start: { dateTime: malmoTime(8, "20:00") } },
          classifications: [{ segment: { name: "Music" }, genre: { name: "Pop" } }],
          priceRanges: [{ min: 495, max: 1295, currency: "SEK" }],
          _embedded: { venues: [arena] },
        },
        {
          id: "tm-03",
          name: "Malmö FF – IFK Göteborg",
          info: "Allsvenskan.",
          url: "https://www.mff.se/",
          dates: { start: { dateTime: malmoTime(3, "15:00") } },
          classifications: [{ segment: { name: "Sports" }, genre: { name: "Football" } }],
          priceRanges: [{ min: 160, max: 450, currency: "SEK" }],
          _embedded: {
            venues: [{ name: "Eleda Stadion", address: { line1: "Eric Perssons väg" }, city: { name: "Malmö" } }],
          },
        },
        {
          id: "tm-04",
          name: "Musikalen Mamma Mia!",
          url: "https://www.malmoopera.se/",
          dates: { start: { dateTime: malmoTime(5, "19:00") } },
          classifications: [{ segment: { name: "Arts & Theatre" }, genre: { name: "Musical" } }],
          priceRanges: [{ min: 395, max: 895, currency: "SEK" }],
          _embedded: {
            venues: [{ name: "Malmö Opera", address: { line1: "Östra Rönneholmsvägen 20" }, city: { name: "Malmö" } }],
          },
        },
        {
          id: "tm-05",
          name: "Big Band-kväll med Malmö Jazz Orchestra",
          url,
          dates: { start: { dateTime: malmoTime(11, "19:30") } },
          classifications: [{ segment: { name: "Music" }, genre: { name: "Jazz" } }],
          priceRanges: [{ min: 200, max: 350, currency: "SEK" }],
          _embedded: {
            venues: [{ name: "Malmö Live Konserthus", address: { line1: "Dag Hammarskjölds torg 4" }, city: { name: "Malmö" } }],
          },
        },
      ],
    },
  };
}
