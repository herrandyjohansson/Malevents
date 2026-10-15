import "server-only";

import { malmoTime } from "../demo-dates";
import { parsePriceText, toCategory } from "../normalize";
import type { EventSource, MalmoEvent } from "../types";

const ID = "malmo-stad";

/** Upstream shape: a municipal calendar feed with Swedish field names. */
interface MalmoStadResponse {
  items: {
    id: string;
    rubrik: string;
    ingress?: string;
    startdatum: string;
    slutdatum?: string;
    plats?: { namn: string; adress?: string };
    kategorier: string[];
    kostnad?: string;
    lank: string;
  }[];
}

function toEvent(item: MalmoStadResponse["items"][number]): MalmoEvent {
  return {
    id: `${ID}:${item.id}`,
    sourceId: ID,
    title: item.rubrik,
    description: item.ingress,
    startsAt: item.startdatum,
    endsAt: item.slutdatum,
    category: toCategory(...item.kategorier),
    venue: item.plats && { name: item.plats.namn, address: item.plats.adress, city: "Malmö" },
    ...parsePriceText(item.kostnad),
    url: item.lank,
  };
}

async function getMalmoStadEvents(): Promise<MalmoEvent[]> {
  // No public endpoint is wired up yet. When one is, fetch it here with
  // fetchJson<MalmoStadResponse>(ID, url) behind LIVE_MODE. Venue coordinates
  // come from the venue lookup in venues.ts.
  const data = demoResponse();
  return data.items.map(toEvent);
}

export const malmoStad: EventSource = {
  id: ID,
  name: "Malmö stad",
  homepage: "https://malmo.se/evenemang",
  description: "The city's public event calendar: libraries, parks, markets and city-run events.",
  kind: "fixture",
  demo: true,
  fetchEvents: getMalmoStadEvents,
};

function demoResponse(): MalmoStadResponse {
  const lank = "https://malmo.se/evenemang";
  return {
    items: [
      {
        id: "1001",
        rubrik: "Sagostund på Stadsbiblioteket",
        ingress: "Högläsning för barn 3–6 år i Barnens bibliotek.",
        startdatum: malmoTime(0, "10:30"),
        slutdatum: malmoTime(0, "11:15"),
        plats: { namn: "Malmö stadsbibliotek", adress: "Kung Oscars väg 11" },
        kategorier: ["Barn & familj"],
        kostnad: "Gratis",
        lank,
      },
      {
        id: "1002",
        rubrik: "Bondemarknad på Möllevångstorget",
        ingress: "Lokala odlare och producenter från hela Skåne.",
        startdatum: malmoTime(2, "09:00"),
        slutdatum: malmoTime(2, "14:00"),
        plats: { namn: "Möllevångstorget" },
        kategorier: ["Mat & dryck", "Marknad"],
        kostnad: "Fri entré",
        lank,
      },
      {
        id: "1003",
        rubrik: "Stadsvandring: Västra hamnen förr och nu",
        ingress: "Guidad promenad från varvsepoken till Turning Torso.",
        startdatum: malmoTime(3, "13:00"),
        slutdatum: malmoTime(3, "14:30"),
        plats: { namn: "Turning Torso", adress: "Lilla Varvsgatan 14" },
        kategorier: ["Föreläsning", "Stadsvandring"],
        kostnad: "100 kr",
        lank,
      },
      {
        id: "1004",
        rubrik: "Jazz i Folkets park",
        ingress: "Sommarscenens höstavslutning med lokala jazzband.",
        startdatum: malmoTime(5, "18:00"),
        slutdatum: malmoTime(5, "21:00"),
        plats: { namn: "Folkets park", adress: "Amiralsgatan 35" },
        kategorier: ["Musik"],
        kostnad: "Gratis",
        lank,
      },
      {
        id: "1005",
        rubrik: "Malmö stadslopp",
        ingress: "5 och 10 km genom centrala Malmö.",
        startdatum: malmoTime(9, "10:00"),
        plats: { namn: "Stortorget" },
        kategorier: ["Idrott", "Löpning"],
        kostnad: "250–350 kr",
        lank,
      },
      {
        id: "1006",
        rubrik: "Workshop: Laga din cykel",
        ingress: "Lär dig byta slang och justera växlar.",
        startdatum: malmoTime(12, "17:00"),
        plats: { namn: "Garaget", adress: "Lönngatan 30" },
        kategorier: ["Workshop"],
        kostnad: "Gratis",
        lank,
      },
    ],
  };
}
