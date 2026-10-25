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
  timeUnknown?: true;
  category: EventCategory;
  venueName?: string;
  venueAddress?: string;
  url: string;
  ticketUrl?: string;
  imageUrl?: string;
  isFree: boolean;
  priceLabel?: string;
  /** Ids of listings merged into this event (MalmoEvent.duplicateIds), so a heart saved on any of them stays lit. */
  duplicateIds?: string[];
  savedAt: string;
}

/** Whether a saved entry is this event, under its own id or the id of a listing merged into it. */
export function isSameSaved(saved: Pick<SavedEvent, "id" | "duplicateIds">, event: Pick<SavedEvent, "id" | "duplicateIds">) {
  const ids = new Set([event.id, ...(event.duplicateIds ?? [])]);
  return ids.has(saved.id) || (saved.duplicateIds ?? []).some((id) => ids.has(id));
}

/** What the Saved tab keeps about an event. Server-safe, so cards can build it while rendering. */
export function toSaved(e: MalmoEvent, priceLabel?: string): Omit<SavedEvent, "savedAt"> {
  return {
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    timeUnknown: e.timeUnknown,
    category: e.category,
    venueName: e.venue?.name,
    venueAddress: [e.venue?.address, e.venue?.city].filter(Boolean).join(", ") || undefined,
    url: e.url,
    ticketUrl: e.ticketUrl,
    imageUrl: e.imageUrl,
    isFree: e.isFree,
    priceLabel,
    duplicateIds: e.duplicateIds,
  };
}

