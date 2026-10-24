import { decodeEntities, truncate } from "@/lib/events/html";
import { localTime } from "@/lib/events/malmo-time";
import { parsePriceText, toCategory } from "@/lib/events/normalize";
import type { MalmoEvent } from "@/lib/events/types";

const ID = "plan-b";
const SITE = "https://www.planbmalmo.com";
const VENUE = { name: "Plan B", address: "Norra Grängesbergsgatan 26B", city: "Malmö", lat: 55.5839, lng: 13.0272 };

/**
 * One event from `/api/eventsEdge`, the broadcast.events feed the Plan B
 * home page loads in the browser. Found with `openweb capture`; the
 * current adapter only reads the featured items in the server HTML.
 */
export interface PlanBEdgeEvent {
  id: string;
  name: string;
  /** Doors, UTC. */
  start_time: string;
  tags?: string[];
  /** Markdown. */
  details?: string;
  photo?: { urls?: { large?: string } };
  place?: { name?: string };
  custom_fields?: {
    show_start_time?: string;
    end_time?: string;
    /** Free text: "SEK 195", "150 kr + fees". */
    cover?: string;
    freeEntry?: boolean;
    soldOut?: boolean;
    /** ONSALE, SOLDOUT … */
    eventStatus?: string;
    type?: string;
    ticketUrl?: string;
    secondaryTitle?: string;
    published?: boolean;
  };
}

/** The site ignores the slug and routes on the id, so any readable slug works. */
function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/å/g, "aa")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function markdownToText(md: string) {
  return decodeEntities(md.replace(/[*_#>`]+/g, "").replace(/\s+/g, " ")).trim();
}

export function planBEdgeToEvent(event: PlanBEdgeEvent): MalmoEvent | undefined {
  const fields = event.custom_fields ?? {};
  const title = decodeEntities(event.name).trim();
  // The feed also lists Plan B's shows at other venues, which other sources cover.
  if (!title || fields.published === false || !event.place?.name?.startsWith("Plan B")) return undefined;
  if (/cancel|inställ/i.test(fields.eventStatus ?? "")) return undefined;

  const doors = localTime(new Date(event.start_time));
  const guess = toCategory(fields.type, event.tags?.join(" "), title);
  const description = truncate([fields.secondaryTitle, event.details && markdownToText(event.details)].filter(Boolean).join(". "));

  return {
    id: `${ID}:${event.id}`,
    sourceId: ID,
    title,
    description,
    // show_start_time is "" on some rows, not missing.
    startsAt: new Date(fields.show_start_time || event.start_time).toISOString(),
    endsAt: fields.end_time ? new Date(fields.end_time).toISOString() : undefined,
    category: guess === "other" ? "music" : guess,
    venue: VENUE,
    ...(fields.freeEntry ? { isFree: true } : parsePriceText(fields.cover)),
    imageUrl: event.photo?.urls?.large,
    url: `${SITE}/events/${slug(title) || "event"}/${event.id}`,
    ticketUrl: fields.ticketUrl || undefined,
    soldOut: fields.soldOut || fields.eventStatus === "SOLDOUT" || undefined,
    notes: fields.show_start_time ? [`Insläpp ${doors}`] : undefined,
  };
}
