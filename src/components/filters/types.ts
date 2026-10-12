import type { Facets } from "@/lib/events/filters";

export interface FilterBarProps {
  mode: "server" | "client";
  facets: Facets;
  sources: { id: string; name: string }[];
  /** Malmö today, yyyy-mm-dd. */
  today: string;
  /** Last month the date picker pages to. */
  lastMonth: string;
  /** Events per day for the date picker, when the page has them. */
  countFor?: (day: string) => number;
  /** Offer "Pick dates" with a calendar that folds open in the bar. Off where the page has its own calendar. */
  datePicker?: boolean;
  /** "events" by default; the map says "events on the map". */
  noun?: string;
  /**
   * "bar" is the full bar for page tops, every choice an inline button.
   * "floating" is one row of chips over the phone map, with the rest in a
   * filter panel.
   */
  variant?: "bar" | "floating";
  className?: string;
}

