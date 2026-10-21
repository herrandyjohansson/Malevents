"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { FilterBar } from "@/components/filters/filter-bar";
import { useFilters } from "@/components/filters/use-filters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addDays, addMonths, formatDay, formatMonth, isDay, monthGrid, monthStart, WEEKDAYS_SHORT } from "@/lib/days";
import { countOnDay, facetCounts, isLongRunning, matcher } from "@/lib/events/filters";
import { eventHref } from "@/lib/events/event-href";
import { useUrlParam } from "@/lib/use-url-param";
import { cn } from "@/lib/utils";

import type { CalendarEvent } from "@/lib/events/view-types";

/** Pills shown per day cell before collapsing into "+N more". */
const MAX_PILLS = 3;
const MAX_MONTHS_AHEAD = 12;

/** Single-day events by start time first, long-running ones after. */
function byDisplayOrder(a: CalendarEvent, b: CalendarEvent) {
  return Number(isLongRunning(a)) - Number(isLongRunning(b)) || a.timeLabel.localeCompare(b.timeLabel);
}

/** The filtered events covering each day of the grid, in display order. */
function groupByDay(events: CalendarEvent[], days: string[]) {
  const map = new Map<string, CalendarEvent[]>(days.map((d) => [d, []]));
  const [gridStart, gridEnd] = [days[0], days[days.length - 1]];
  for (const e of events) {
    if (e.endDay < gridStart || e.startDay > gridEnd) continue;
    const from = e.startDay < gridStart ? gridStart : e.startDay;
    const to = e.endDay > gridEnd ? gridEnd : e.endDay;
    for (let d = from; d <= to; d = addDays(d, 1)) map.get(d)?.push(e);
  }
  for (const list of map.values()) list.sort(byDisplayOrder);
  return map;
}

/** First day of the month named by ?month=yyyy-mm, kept within the months the calendar offers. */
function shownMonth(param: string | null, first: string, last: string) {
  const day = `${param}-01`;
  if (!param || !/^\d{4}-\d{2}$/.test(param) || !isDay(day)) return first;
  return day < first ? first : day > last ? last : day;
}

export function CalendarView({
  events,
  today,
  sources,
}: {
  events: CalendarEvent[];
  today: string;
  sources: { id: string; name: string }[];
}) {
  // The shown month and the open day live in the URL (?month=yyyy-mm&day=yyyy-mm-dd) so they can be shared.
  const currentMonth = monthStart(today);
  const lastMonth = addMonths(currentMonth, MAX_MONTHS_AHEAD);
  const [monthParam, setMonthParam] = useUrlParam("month");
  const [dayParam, setDayParam] = useUrlParam("day");
  const month = shownMonth(monthParam, currentMonth, lastMonth);
  const setMonth = (next: string) => setMonthParam(next === currentMonth ? null : next.slice(0, 7));
  const selectedDay = isDay(dayParam) ? dayParam : null;
  const setSelectedDay = (day: string | null) => setDayParam(day);
  // The shared filters (in the URL), applied in the browser.
  const { filters } = useFilters("client");
  const filtered = useMemo(() => events.filter(matcher(filters, today)), [events, filters, today]);
  const facets = useMemo(() => facetCounts(events, filters, today), [events, filters, today]);

  // This month starts at the current week: whole weeks already over are only noise.
  const days = monthGrid(month).filter((d, i, all) => month !== currentMonth || all[i - (i % 7) + 6] >= today);
  const eventsByDay = groupByDay(filtered, days);
  const monthKey = month.slice(0, 7);
  const inMonth = filtered.filter((e) => e.startDay.slice(0, 7) <= monthKey && e.endDay.slice(0, 7) >= monthKey);
  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="glass rounded-2xl border p-2.5">
        <FilterBar
          mode="client"
          facets={facets}
          sources={sources}
          today={today}
          lastMonth={lastMonth}
          countFor={(day) => countOnDay(events, day)}
          noun="events in all months"
        />
      </div>

      {/* Month navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-xl font-semibold tracking-tight sm:text-2xl">
          {formatMonth(month)}
        </h2>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {inMonth.length === 1 ? "1 event" : `${inMonth.length} events`} in {formatMonth(month).split(" ")[0]}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            disabled={month <= currentMonth}
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setMonth(currentMonth)}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            disabled={month >= lastMonth}
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Month grid */}
      <div className="bg-card/80 flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border">
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="text-muted-foreground px-2 py-2 text-center text-xs font-medium uppercase">
              {d}
            </div>
          ))}
        </div>
        <div className="grid flex-1 auto-rows-fr grid-cols-7">
          {days.map((day) => {
            const list = eventsByDay.get(day) ?? [];
            const outside = day.slice(0, 7) !== monthKey;
            const isToday = day === today;
            const isPast = day < today;
            const shown = list.slice(0, MAX_PILLS);
            return (
              <div
                key={day}
                className={cn(
                  "group relative flex min-h-20 flex-col gap-1 border-r border-b p-1 sm:p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                  outside && "bg-background/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${formatDay(day)}, ${list.length} events`}
                  className="absolute inset-0 rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
                />
                <span
                  className={cn(
                    "pointer-events-none relative flex size-6 items-center justify-center self-end rounded-full text-xs font-medium sm:self-start",
                    (outside || isPast) && "text-muted-foreground",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {Number(day.slice(8))}
                </span>

                {/* Phones: coloured dots. Larger screens: event pills. */}
                {list.length > 0 && (
                  <div className="pointer-events-none relative flex flex-wrap gap-0.5 sm:hidden">
                    {list.slice(0, 6).map((e) => (
                      <span
                        key={e.id}
                        className="size-1.5 rounded-full"
                        style={{ background: e.color }}
                      />
                    ))}
                  </div>
                )}
                <ul className="relative hidden min-w-0 flex-col gap-0.5 sm:flex">
                  {shown.map((e) => (
                    <li key={e.id}>
                      <EventPill event={e} />
                    </li>
                  ))}
                  {list.length > MAX_PILLS && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className="text-muted-foreground hover:text-foreground px-1 text-[11px] font-medium"
                      >
                        +{list.length - MAX_PILLS} more
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDay && formatDay(selectedDay)}</DialogTitle>
            <DialogDescription>
              {selectedEvents.length === 0
                ? "Nothing on this day with the current filters."
                : selectedEvents.length === 1
                  ? "1 event"
                  : `${selectedEvents.length} events`}
            </DialogDescription>
          </DialogHeader>
          {selectedEvents.length > 0 && (
            <ul className="-mx-2 flex flex-col gap-1 overflow-y-auto">
              {selectedEvents.map((e) => (
                <li key={e.id}>
                  <DayEvent event={e} onOpen={() => setSelectedDay(null)} />
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventPill({ event: e }: { event: CalendarEvent }) {
  const longRunning = isLongRunning(e);
  return (
    <Link
      href={eventHref(e.id)}
      title={`${e.title}${e.venueName ? ` · ${e.venueName}` : ""} · ${e.dateLabel}`}
      className={cn(
        "flex min-w-0 items-center gap-1 rounded border-l-2 px-1.5 py-0.5 text-[11px] leading-tight transition-opacity hover:brightness-125",
      )}
      style={{ borderColor: e.color, background: `${e.color}${longRunning ? "14" : "26"}` }}
    >
      {!longRunning && <span className="text-muted-foreground shrink-0 tabular-nums">{e.timeLabel}</span>}
      <span className="truncate">{e.title}</span>
    </Link>
  );
}

function DayEvent({ event: e, onOpen }: { event: CalendarEvent; onOpen: () => void }) {
  return (
    <Link
      href={eventHref(e.id)}
      onClick={onOpen}
      className="hover:bg-accent/60 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ background: e.color }}
      >
        {e.emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{e.title}</span>
        <span className="text-muted-foreground text-sm">
          {e.dateLabel}
          {e.venueName && ` · ${e.venueName}`}
        </span>
        <span className="text-muted-foreground text-xs">
          {e.categoryLabel}
          {e.priceLabel && ` · ${e.priceLabel}`}
        </span>
      </span>
      <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" aria-hidden />
    </Link>
  );
}
