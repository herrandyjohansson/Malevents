import type { Filterable } from "@/lib/events/filters";
import type { EventCategory } from "@/lib/events/types";

/** Serializable event shape the calendar renders on the client. */
export interface CalendarEvent extends Filterable {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  color: string;
  emoji: string;
  /** First and last Malmö-local day the event covers, yyyy-mm-dd. */
  startDay: string;
  endDay: string;
  /** Start time, e.g. "19:30". */
  timeLabel: string;
  /** Full date label, e.g. "Fri 9 Oct · 19:30–22:00". */
  dateLabel: string;
  venueName?: string;
  priceLabel?: string;
  isFree: boolean;
  url: string;
  sourceId: string;
  sourceName: string;
  /** Lower-cased title, venue and description, for search. */
  searchText: string;
}
