import "server-only";

import { eventHref } from "./event-href";
import { isUpcoming } from "./filters";
import { formatEventDate, formatPrice } from "./format";
import type { SearchDocument } from "./search";
import type { MalmoEvent } from "./types";
import { buildVenues } from "./venue-data";
import { venueAliasNames } from "./venues";

/** Compact, public search records; the full upstream events stay on the server. */
export function buildSearchDocuments(events: MalmoEvent[], now: Date): SearchDocument[] {
  return [
    ...events.filter((event) => isUpcoming(event, now)).map((event): SearchDocument => ({
      id: `event:${event.id}`,
      kind: "event",
      title: event.title,
      description: (event.description ?? "").slice(0, 300),
      // The address carries the room (Teatern, Saluhallen) for events filed under a venue's own name.
      venueName: [event.venue?.name, event.venue?.address].filter(Boolean).join(" "),
      subtitle: [formatEventDate(event), event.venue?.name]
        .filter(Boolean).join(" · "),
      href: eventHref(event.id),
      imageUrl: event.imageUrl,
      category: event.category,
      startsAt: event.startsAt,
      price: formatPrice(event),
      status: event.cancelled ? "Cancelled" : event.soldOut ? "Sold out" : undefined,
    })),
    ...buildVenues(events, now).map((venue): SearchDocument => ({
      id: `venue:${venue.slug}`,
      kind: "venue",
      title: venue.name,
      description: [venue.address, venue.city].filter(Boolean).join(" "),
      venueName: [venue.name, ...venueAliasNames(venue.name)].join(" "),
      subtitle: [
        `${venue.events.length} upcoming ${venue.events.length === 1 ? "event" : "events"}`,
        venue.address,
      ].filter(Boolean).join(" · "),
      href: `/venues/${venue.slug}`,
      imageUrl: venue.imageUrl,
      upcoming: venue.events.slice(0, 2).map((event) => ({
        title: event.title,
        href: eventHref(event.id),
        date: formatEventDate(event),
      })),
    })),
  ];
}
