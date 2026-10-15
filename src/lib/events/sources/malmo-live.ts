import "server-only";

import { LIVE_MODE } from "../config";
import { malmoTime } from "../demo-dates";
import { malmoLocalToIso } from "../malmo-time";
import { decodeEntities, truncate } from "../html";
import { fetchJson } from "../http";
import { toCategory } from "../normalize";
import type { EventSource, MalmoEvent } from "../types";

const ID = "malmo-live";
const SITE = "https://malmolive.se";
const ENDPOINT = `${SITE}/api/events`;

/**
 * One row per performance from the Drupal REST export that feeds the
 * site's own "Kommande evenemang" listing. Every value is a string, and
 * text fields still carry HTML entities.
 */
export interface MalmoLiveRow {
  title: string;
  field_text_plain_long: string;
  /** Malmö local time without an offset, e.g. "2026-10-09T19:00:00". */
  field_date_time: string;
  price_low: string;
  price_high: string;
  price_currency: string;
  /** Hall inside the building: Konsertsalen, Kuben, Foajén … */
  field_venue: string;
  tessitura_event_id: string;
  tessitura_instance_id: string;
  /** "1" when sold out, otherwise "" or "0". */
  sold_out: string;
  /** Site-relative image path. */
  field_media_image_1: string;
  /** Site-relative event page, e.g. "/program/big-in-japan-2026". */
  view_node: string;
  /** Comma-separated tags, e.g. "Malmö SymfoniOrkester, Filmmusik". */
  field_keywords_target_id: string;
}

const VENUE = {
  name: "Malmö Live Konserthus",
  street: "Dag Hammarskjölds torg 4",
  city: "Malmö",
  lat: 55.6084,
  lng: 12.9942,
};

function price(value: string) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export function malmoLiveRowToEvent(row: MalmoLiveRow): MalmoEvent {
  const [ymd, hms = "00:00"] = row.field_date_time.split("T");
  const low = price(row.price_low);
  const high = price(row.price_high) ?? low;
  const description = truncate(decodeEntities(row.field_text_plain_long ?? "").trim());
  const hall = decodeEntities(row.field_venue ?? "").trim();

  return {
    id: `${ID}:${row.tessitura_instance_id || `${row.view_node}#${row.field_date_time}`}`,
    sourceId: ID,
    title: decodeEntities(row.title).trim(),
    description: row.sold_out === "1" ? `Slutsålt. ${description ?? ""}`.trim() : description,
    startsAt: malmoLocalToIso(ymd, hms.slice(0, 5)),
    category: toCategory(row.field_keywords_target_id, row.title),
    venue: {
      name: VENUE.name,
      address: hall ? `${hall}, ${VENUE.street}` : VENUE.street,
      city: VENUE.city,
      lat: VENUE.lat,
      lng: VENUE.lng,
    },
    isFree: /gratis|fri entré/i.test(`${row.title} ${row.field_keywords_target_id}`),
    price: high ? { min: low ?? high, max: high, currency: row.price_currency || "SEK" } : undefined,
    imageUrl: row.field_media_image_1 ? new URL(row.field_media_image_1, SITE).toString() : undefined,
    url: row.view_node ? new URL(row.view_node, SITE).toString() : `${SITE}/program`,
    ticketUrl:
      row.tessitura_event_id && row.tessitura_instance_id
        ? `https://biljetter.malmolive.se/events/${row.tessitura_event_id}/${row.tessitura_instance_id}?lang=sv`
        : undefined,
    soldOut: row.sold_out === "1" || undefined,
    notes: hall ? [hall] : undefined,
  };
}

/**
 * Malmö Live Konserthus (the concert hall in the Clarion Hotel & Congress
 * Malmö Live building). The site has no documented API, but its programme
 * page loads a public JSON feed, which this adapter reads directly.
 */
async function getMalmoLiveEvents(): Promise<MalmoEvent[]> {
  const rows = LIVE_MODE ? await fetchJson<MalmoLiveRow[]>(ID, ENDPOINT) : demoRows();
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  return rows
    .filter((row) => row.title && row.field_date_time)
    .map(malmoLiveRowToEvent)
    .filter((e) => Date.parse(e.startsAt) >= cutoff);
}

export const malmoLive: EventSource = {
  id: ID,
  name: "Malmö Live",
  homepage: `${SITE}/program`,
  description: "Malmö Live Konserthus programme (MSO, pop, jazz, family), from the JSON feed behind the site's listing.",
  kind: LIVE_MODE ? "json-api" : "fixture",
  endpoint: ENDPOINT,
  demo: !LIVE_MODE,
  fetchEvents: getMalmoLiveEvents,
};

/** Rows in the exact shape /api/events returns, with dates kept upcoming. */
function demoRows(): MalmoLiveRow[] {
  const row = (
    day: number,
    time: string,
    r: Pick<MalmoLiveRow, "title" | "field_text_plain_long" | "field_venue" | "view_node" | "field_keywords_target_id"> &
      Partial<MalmoLiveRow> & { low: string; high: string; event: string; instance: string },
  ): MalmoLiveRow => ({
    field_date_time: malmoTime(day, time).slice(0, 19),
    price_low: r.low,
    price_high: r.high,
    price_currency: "SEK",
    tessitura_event_id: r.event,
    tessitura_instance_id: r.instance,
    sold_out: "",
    field_media_image_1: "",
    ...r,
  });
  return [
    row(1, "19:00", {
      title: "Big in Japan 2026",
      field_text_plain_long: "Från Kicki’s Express Delivery Service till Spirited Away: MSO spelar musik från japansk film och anime.",
      field_venue: "Konsertsalen",
      view_node: "/program/big-in-japan-2026",
      field_keywords_target_id: "Malmö SymfoniOrkester, Filmmusik",
      low: "295.00",
      high: "595.00",
      event: "30274",
      instance: "30276",
    }),
    row(2, "11:00", {
      title: "Vem är arg?",
      field_text_plain_long: "En musikalisk föreställning för de yngsta om stora känslor.",
      field_venue: "Kuben",
      view_node: "/program/vem-ar-arg",
      field_keywords_target_id: "Barn &amp; Familj",
      low: "125.00",
      high: "125.00",
      event: "30596",
      instance: "30597",
    }),
    row(2, "19:30", {
      title: "Sven Ingvars",
      field_text_plain_long: "Dansbandsklassikerna live i Konsertsalen.",
      field_venue: "Konsertsalen",
      view_node: "/program/sven-ingvars",
      field_keywords_target_id: "Pop &amp; Rock",
      low: "450.00",
      high: "650.00",
      event: "30610",
      instance: "30611",
    }),
    row(7, "09:30", {
      title: "Babyrytmik omgång 1",
      field_text_plain_long: "Sång, rytm och rörelse för bebisar och deras vuxna.",
      field_venue: "Foajén",
      view_node: "/program/babyrytmik",
      field_keywords_target_id: "Barn &amp; Familj",
      low: "100.00",
      high: "100.00",
      event: "30772",
      instance: "30773",
      sold_out: "1",
    }),
    row(15, "19:30", {
      title: "Viktor Norén &amp; Linus Wahlgren - Våra Liv, Våra Musikaler",
      field_text_plain_long: "En kväll med musikalhits och berättelser från scenen.",
      field_venue: "Konsertsalen",
      view_node: "/program/vara-liv-vara-musikaler",
      field_keywords_target_id: "Underhållning &amp; Humor",
      low: "495.00",
      high: "795.00",
      event: "30880",
      instance: "30881",
    }),
  ];
}
