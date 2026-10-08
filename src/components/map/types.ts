import type { EventCategory } from "@/lib/events/types";

/** Serializable, pre-formatted event for the map (server → client). */
export interface MapEvent {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  color: string;
  venueName: string;
  lat: number;
  lng: number;
  timeLabel: string;
  priceLabel?: string;
  url: string;
  sourceName: string;
}

export interface MapDay {
  /** yyyy-mm-dd in Malmö time */
  day: string;
  weekday: string;
  dayOfMonth: string;
  month: string;
  label: string;
  events: MapEvent[];
}
