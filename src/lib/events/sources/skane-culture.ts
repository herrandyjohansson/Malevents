import "server-only";

import { malmoTime } from "../demo-dates";
import { SourceError } from "../http";
import { toCategory } from "../map";
import type { EventSource, MalmoEvent } from "../types";

const ID = "skane-culture";

/**
 * Regional culture calendar (demo). Set DEMO_SOURCE_FAILURE=true to make it
 * throw, which shows how the page degrades when one upstream is down.
 */
async function getSkaneCultureEvents(): Promise<MalmoEvent[]> {
  if (process.env.DEMO_SOURCE_FAILURE === "true") {
    throw new SourceError(ID, "HTTP 503 from demo upstream");
  }

  const url = "https://www.modernamuseet.se/malmo/";
  return [
    {
      id: "mm-1",
      title: "Utställning: Nordiskt ljus",
      text: "Måleri och fotografi från 1900-talets Norden.",
      from: malmoTime(0, "11:00"),
      to: malmoTime(30, "17:00"),
      venue: "Moderna Museet Malmö",
      address: "Ola Billgrens plats 2–4",
      tags: ["Konst", "Utställning"],
      free: true,
    },
    {
      id: "mm-2",
      title: "Artist talk med årets stipendiat",
      text: "Samtal om process och material.",
      from: malmoTime(4, "18:00"),
      venue: "Moderna Museet Malmö",
      address: "Ola Billgrens plats 2–4",
      tags: ["Samtal"],
      free: true,
    },
    {
      id: "pan-1",
      title: "Filmklubb: Bergman på stor duk",
      text: "Smultronstället i nyrestaurerad version.",
      from: malmoTime(6, "18:30"),
      venue: "Panora",
      address: "Friisgatan 19",
      tags: ["Film"],
      free: false,
    },
  ].map(
    (e): MalmoEvent => ({
      id: `${ID}:${e.id}`,
      sourceId: ID,
      title: e.title,
      description: e.text,
      startsAt: e.from,
      endsAt: e.to,
      category: toCategory(...e.tags),
      venue: { name: e.venue, address: e.address, city: "Malmö" },
      isFree: e.free,
      url,
    }),
  );
}

export const skaneCulture: EventSource = {
  id: ID,
  name: "Skåne culture calendar",
  homepage: "https://www.modernamuseet.se/malmo/",
  description: "Regional culture calendar: museums, galleries and cinemas. Set DEMO_SOURCE_FAILURE=true to see a failing source.",
  kind: "fixture",
  cacheProfile: "days",
  demo: true,
  fetchEvents: getSkaneCultureEvents,
};
