import "server-only";

import { demoTribeEvent, eventsCalendarSource } from "./events-calendar";

const SITE = "https://medleymalmo.se";

/** Medley: concerts, club nights and talks on Södra Promenaden, from the site's events API. */
export const medley = eventsCalendarSource({
  id: "medley",
  name: "Medley",
  site: SITE,
  homepage: SITE,
  description: "Medley's concerts, club nights and talks, from The Events Calendar's JSON API.",
  venue: { name: "Medley", address: "Södra Promenaden 51", lat: 55.6034, lng: 13.0066 },
  // The site sets no categories; most nights are gigs.
  fallback: "music",
  // Evenings booked for private parties are listed as "medley är abonnerat denna kväll".
  skip: (e) => /abonnerat/i.test(e.title),
  // The site's time zone is "UTC+0", so its utc_* dates are Malmö wall-clock times.
  localTimes: true,
  // The API is slow (about 500 KB per 50 events, two pages).
  timeoutMs: 15_000,
  demo: () => [
    demoTribeEvent(1, "Will Hoge Band (US)", 2, "20:00", 2, "", `${SITE}/event/will-hoge-band-us/`),
    demoTribeEvent(2, "medley är abonnerat denna kväll", 3, "17:00", 6, "", `${SITE}/event/medley-ar-abonnerat-denna-kvall/`),
    demoTribeEvent(3, "Mick Harvey (AUS)", 4, "20:00", 2, "", `${SITE}/event/mick-harvey-aus/`),
  ],
});
