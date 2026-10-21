import "server-only";

import { demoTribeEvent, eventsCalendarSource } from "./events-calendar";

const SITE = "https://malmokonsthall.se";

/** Malmö Konsthall: talks, workshops, family weekends and openings, from the site's events API. */
export const malmoKonsthall = eventsCalendarSource({
  id: "malmo-konsthall",
  name: "Malmö Konsthall",
  site: SITE,
  homepage: `${SITE}/evenemang/`,
  description: "Malmö Konsthall's programme (talks, workshops, family weekends, openings), from The Events Calendar's JSON API.",
  venue: { name: "Malmö Konsthall", address: "S:t Johannesgatan 7", lat: 55.5953, lng: 12.9994 },
  categories: {
    barn: "family",
    musik: "music",
    vernissage: "art",
    specialvisning: "art",
    samtal: "talks",
    litteratur: "talks",
    workshop: "talks",
  },
  fallback: "art",
  demo: () => [
    demoTribeEvent(1, "Helgverkstad", 2, "13:00", 3.5, "Barn", `${SITE}/evenemang/`),
    demoTribeEvent(2, "Samtal: Konst och stad", 4, "18:00", 1.5, "Samtal", `${SITE}/evenemang/`),
  ],
});
