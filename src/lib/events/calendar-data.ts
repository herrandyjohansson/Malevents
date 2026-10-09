import "server-only";

import type { CalendarEvent } from "@/components/calendar/types";

import { localDay } from "./filters";
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS, formatEventDate, formatPrice, formatTime } from "./format";
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
      const startDay = localDay(new Date(e.startsAt));
      const endDay = e.endsAt ? localDay(new Date(e.endsAt)) : startDay;
      return {
        id: e.id,
        title: e.title,
        category: e.category,
        categoryLabel: CATEGORY_LABELS[e.category],
        color: CATEGORY_COLORS[e.category],
        emoji: CATEGORY_EMOJI[e.category],
        startDay,
        endDay: endDay < startDay ? startDay : endDay,
        timeLabel: formatTime(e.startsAt),
        dateLabel: formatEventDate(e),
        venueName: e.venue?.name,
        priceLabel: formatPrice(e),
        isFree: e.isFree,
        url: e.url,
        sourceId: e.sourceId,
        sourceName: sourceNames.get(e.sourceId) ?? e.sourceId,
        searchText: `${e.title} ${e.venue?.name ?? ""} ${e.description ?? ""}`.toLowerCase(),
      };
    })
    .filter((e) => e.endDay >= monthStart)
    .sort((a, b) => a.startDay.localeCompare(b.startDay) || a.timeLabel.localeCompare(b.timeLabel));
}
