import type { EventCategory, MalmoEvent } from "@/lib/events/types";

/**
 * Saved events, kept in this browser only (no account needed). Each entry is
 * a snapshot of the event, so the Saved tab still works after an event drops
 * out of the source feeds.
 */
export interface SavedEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  category: EventCategory;
  venueName?: string;
  venueAddress?: string;
  url: string;
  ticketUrl?: string;
  imageUrl?: string;
  isFree: boolean;
  priceLabel?: string;
  savedAt: string;
}

/** What the Saved tab keeps about an event. Server-safe, so cards can build it while rendering. */
export function toSaved(e: MalmoEvent, priceLabel?: string): Omit<SavedEvent, "savedAt"> {
  return {
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    category: e.category,
    venueName: e.venue?.name,
    venueAddress: [e.venue?.address, e.venue?.city].filter(Boolean).join(", ") || undefined,
    url: e.url,
    ticketUrl: e.ticketUrl,
    imageUrl: e.imageUrl,
    isFree: e.isFree,
    priceLabel,
  };
}

