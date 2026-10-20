import type { Filterable } from "./filters";
import type { EventCategory } from "./types";

/*
 * Serializable, pre-formatted events the server hands to client views. They
 * extend Filterable, so the shared filters run on them in the browser.
 */

/** An event on the map: only events with a known venue location. */
export interface MapEvent extends Filterable {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  color: string;
  emoji: string;
  venueName: string;
  lat: number;
  lng: number;
  timeLabel: string;
  priceLabel?: string;
  url: string;
  sourceName: string;
}

/** An event in the month calendar. */
export interface CalendarEvent extends Filterable {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  color: string;
  emoji: string;
  /** Start time, e.g. "19:30". */
  timeLabel: string;
  /** Full date label, e.g. "Fri 9 Oct · 19:30–22:00". */
  dateLabel: string;
  venueName?: string;
  priceLabel?: string;
  url: string;
  sourceName: string;
}
