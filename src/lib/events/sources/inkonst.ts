import "server-only";

import { ticksterDemoDetail, ticksterDemoListing, ticksterSource } from "./tickster";

/** Inkonst (Bergsgatan 29): concerts, club nights and performing arts, sold through Tickster. */
export const inkonst = ticksterSource({
  id: "inkonst",
  name: "Inkonst",
  homepage: "https://inkonst.com/en/events",
  description: "Concerts, clubs and performing arts at Inkonst, from its public Tickster organizer page plus each event page.",
  organizerUrl: "https://www.tickster.com/se/sv/events/by/bkz8z545crn3x5m/inkonst",
  venue: { name: "Inkonst", address: "Bergsgatan 29", city: "Malmö", lat: 55.5966, lng: 13.0004 },
  placeFilter: /malmö|inkonst/i,
  demo: () => ({
    listingHtml: ticksterDemoListing("Inkonst", [
      { id: "eyc39mvw72uzgj1", slug: "season-pass-concerts-aw26", title: "Season Pass Concerts AW26", day: 0 },
      { id: "a32ddefmpnmeh58", slug: "grovskopa-mord-resurrection", title: "Grovskopa MORD Resurrection", day: 1 },
      { id: "k2m9q8r7t6y5u4i", slug: "jonas-abrahamsson-tunga-divisionen", title: "Jonas Abrahamsson + TUNGA DIVISIONEN + Klara Anna Deepali", day: 6 },
      { id: "p0o9i8u7y6t5r4e", slug: "det-nya-landet-ibrahim-faal", title: "Det nya landet – Ibrahim Faal (teater)", day: 4 },
    ]),
    detailHtml: (l) =>
      l.title.startsWith("Grovskopa")
        ? ticksterDemoDetail(`${Number(l.ymd.slice(8))} okt 23:59`, "150:-", "<p>Club, 20+</p>")
        : ticksterDemoDetail(`${Number(l.ymd.slice(8))} okt 19:45`, "220:-"),
  }),
});
