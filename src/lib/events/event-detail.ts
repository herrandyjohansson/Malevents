import "server-only";

import { getAllEvents } from "./aggregate";
import { AREA_NAMES } from "./areas";
import { isUpcoming, toFilterable } from "./filters";
import { getSource } from "./sources";
import type { MalmoEvent } from "./types";
import { venueSlug } from "./venues";

export interface EventDetail {
  event: MalmoEvent;
  /** The listing site's display name, e.g. "Tickster · Malmö". */
  sourceName: string;
  /** Everyday area name, when the venue has coordinates inside one. */
  areaName?: string;
  ended: boolean;
  /** The next few upcoming events at the same venue. */
  moreAtVenue: MalmoEvent[];
}

/** How many other events at the venue the page lists. */
const MORE_AT_VENUE = 4;

/** One event by id, with what its page shows around it; undefined when the feed no longer has it. */
export async function getEventDetail(id: string): Promise<EventDetail | undefined> {
  // Wait for every source: a link to an event from a slow source must not read as "not found".
  const { events, sources } = await getAllEvents("complete");
  // A listing merged into another (same event from another source) still opens, as the kept record.
  const event = events.find((e) => e.id === id) ?? events.find((e) => e.duplicateIds?.includes(id));
  if (!event) return undefined;
  const now = new Date();
  const venue = event.venue && venueSlug(event.venue.name);
  const area = toFilterable(event).area;
  return {
    event,
    sourceName: sources.find((s) => s.id === event.sourceId)?.name ?? getSource(event.sourceId)?.name ?? event.sourceId,
    areaName: area && AREA_NAMES[area],
    ended: !isUpcoming(event, now),
    moreAtVenue: venue
      ? events
          .filter((e) => e.id !== event.id && e.venue && venueSlug(e.venue.name) === venue && isUpcoming(e, now))
          .slice(0, MORE_AT_VENUE)
      : [],
  };
}
