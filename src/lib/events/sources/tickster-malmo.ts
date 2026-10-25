import "server-only";

import { ticksterDemoDetail, ticksterDemoListing, ticksterSource } from "./tickster";

/**
 * Every public Tickster event in Malmö (about 300 at a time: Babel, Grand
 * Malmö, Ungdomens Hus, Turning Torso, clubs, comedy …), read from Tickster's
 * city page sorted by start date. Venues come from each event's place text.
 * Events also listed by a venue source (Inkonst, Slagthuset) are merged by
 * the aggregator's de-duplication.
 */
export const ticksterMalmo = ticksterSource({
  id: "tickster-malmo",
  name: "Tickster · Malmö",
  homepage: "https://www.tickster.com/se/sv/events/in/malm%C3%B6",
  description: "All public Tickster events in Malmö, from the city listing plus each event page for time, price and image.",
  organizerUrl: "https://www.tickster.com/se/sv/events/in/malm%C3%B6",
  query: "sort=eventstart",
  pageSize: 16,
  // ~300 events at 16 a page; 25 pages reaches the end of the listing.
  maxPages: 25,
  placeFilter: /malmö/i,
  aggregator: true,
  demo: () => ({
    listingHtml: ticksterDemoListing("Babel", [
      { id: "y0wj7nctdkwe50e", slug: "krismote", title: "Krismöte!", day: 2 },
      { id: "uxj5g5fhlwvjta8", slug: "malmo-tantra-festival-autumn-2026", title: "Malmö Tantra Festival Autumn 2026", day: 3 },
      { id: "q1w2e3r4t5y6u7i", slug: "stand-up-pa-babel", title: "Stand-up på Babel", day: 40 },
      { id: "o9i8u7y6t5r4e3w", slug: "julkonsert", title: "Julkonsert med Malmö Kammarkör", day: 75 },
      { id: "z1x2c3v4b5n6m7l", slug: "vinterjazz", title: "Vinterjazz", day: 110 },
    ]),
    detailHtml: () => ticksterDemoDetail("20:00", "180:-"),
  }),
});
