import "server-only";

import type { CalendarEvent } from "@/components/calendar/types";

import { toFilterable } from "./filters";
import { localDay } from "./malmo-time";
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS, formatEventDate, formatPrice, formatStartTime } from "./format";
import type { MalmoEvent, SourceStatus } from "./types";

/**
 * Every event that is still running on or after the first day of the current
 * month, shaped for the calendar. Earlier days of this month stay visible so
 * the month grid isn't half empty.
 */
export function buildCalendarEvents(events: MalmoEvent[], sources: SourceStatus[], now: Date): CalendarEvent[] {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const monthStart = `${localDay(now).slice(0, 7)}-01`;

  return events
    .map((e): CalendarEvent => {
      return {
        ...toFilterable(e),
        id: e.id,
        title: e.title,
        category: e.category,
        categoryLabel: CATEGORY_LABELS[e.category],
        color: CATEGORY_COLORS[e.category],
        emoji: CATEGORY_EMOJI[e.category],
        timeLabel: formatStartTime(e),
        dateLabel: formatEventDate(e),
        venueName: e.venue?.name,
        priceLabel: formatPrice(e),
        url: e.url,
        sourceName: sourceNames.get(e.sourceId) ?? e.sourceId,
      };
    })
    .filter((e) => e.endDay >= monthStart)
    .sort((a, b) => a.startDay.localeCompare(b.startDay) || a.timeLabel.localeCompare(b.timeLabel));
}
