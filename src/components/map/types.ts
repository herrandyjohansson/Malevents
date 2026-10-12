import type { Filterable } from "@/lib/events/filters";
import type { EventCategory } from "@/lib/events/types";

/** Serializable, pre-formatted event for the map (server → client). */
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
  /** First and last Malmö day the event runs, yyyy-mm-dd. */
  startDay: string;
  endDay: string;
  timeLabel: string;
  priceLabel?: string;
  url: string;
  sourceName: string;
}
