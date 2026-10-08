import type { EventCategory } from "@/lib/events/types";

/** Serializable, pre-formatted event for the map (server → client). */
export interface MapEvent {
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

/** One selectable range on the map: the whole week, or a single day. */
export interface MapView {
  key: string;
  kind: "week" | "day";
  label: string;
  /** Chip text */
  top: string;
  middle: string;
  bottom: string;
  events: MapEvent[];
}
