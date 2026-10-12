import "server-only";

import { isUpcoming } from "./filters";
import type { EventCategory, MalmoEvent } from "./types";
import { hasCoordinates } from "./venues";

export interface Venue {
  slug: string;
  name: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  /** Upcoming events here, soonest first. */
  events: MalmoEvent[];
  /** Upcoming events per category, most common first. */
  categories: { category: EventCategory; count: number }[];
  /** The first upcoming event with a picture, for the venue's cover. */
  imageUrl?: string;
}

/** URL-safe slug that keeps Swedish letters readable: "Malmö Opera" → "malmo-opera". */
export function venueSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Every venue with at least one upcoming event, busiest first. */
export function buildVenues(events: MalmoEvent[], now: Date): Venue[] {
  const bySlug = new Map<string, MalmoEvent[]>();
  for (const e of events) {
    if (!e.venue?.name || !isUpcoming(e, now)) continue;
    const slug = venueSlug(e.venue.name);
    if (!slug) continue;
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), e]);
  }

  return [...bySlug.entries()]
    .map(([slug, list]) => {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      // Prefer the record that knows the most about the place.
      const best =
        list.find((e) => hasCoordinates(e) && e.venue?.address)?.venue ??
        list.find((e) => hasCoordinates(e))?.venue ??
        list[0].venue!;
      const counts = new Map<EventCategory, number>();
      for (const e of list) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
      return {
        slug,
        name: best.name,
        address: best.address,
        city: best.city,
        lat: best.lat,
        lng: best.lng,
        events: list,
        categories: [...counts.entries()]
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
        imageUrl: list.find((e) => e.imageUrl)?.imageUrl,
      };
    })
    .sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name, "sv"));
}
