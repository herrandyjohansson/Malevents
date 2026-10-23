"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { FilterBar } from "@/components/filters/filter-bar";
import { useFilters } from "@/components/filters/use-filters";
import { Button } from "@/components/ui/button";
import { addDays, addMonths, formatDay, formatMonth, isDay, monthGrid, monthStart, WEEKDAYS_SHORT } from "@/lib/days";
import { countOnDay, facetCounts, filtersToParams, isLongRunning, matcher, type EventFilters } from "@/lib/events/filters";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/events/format";
import type { EventCategory } from "@/lib/events/types";
import { useUrlParam } from "@/lib/use-url-param";
import { cn } from "@/lib/utils";

import type { CalendarEvent } from "@/lib/events/view-types";

/** Kinds of event listed per day cell before collapsing into "+N more". */
const MAX_KINDS = 5;
const MAX_MONTHS_AHEAD = 12;

interface DayKinds {
  total: number;
  /** Busiest kind first. */
  kinds: { category: EventCategory; count: number }[];
}

/**
 * How many filtered events of each kind are on each day of the grid.
 * Exhibitions and other long-running events are left out: they would be on
 * every day and drown the rest. The day page lists them separately.
 */
function summarizeDays(events: CalendarEvent[], days: string[]) {
  const counts = new Map<string, Map<EventCategory, number>>(days.map((d) => [d, new Map()]));
  for (const e of events) {
    if (isLongRunning(e)) continue;
    // A show running past midnight counts on both days, as on the day page.
    for (let d = e.startDay; d <= e.endDay; d = addDays(d, 1)) {
      const day = counts.get(d);
      day?.set(e.category, (day.get(e.category) ?? 0) + 1);
    }
  }
  const summary = new Map<string, DayKinds>();
  for (const [day, byKind] of counts) {
    const kinds = [...byKind.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
    summary.set(day, { total: kinds.reduce((n, k) => n + k.count, 0), kinds });
  }
  return summary;
}

/** The day page, with the calendar's filters carried along and one kind picked. */
function dayHref(day: string, filters: EventFilters, category?: EventCategory) {
  const params = filtersToParams({ ...filters, cats: category ? [category] : [], when: "all", from: undefined, to: undefined });
  const query = params.toString();
  return `/days/${day}${query ? `?${query}` : ""}`;
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
  // The shown month lives in the URL (?month=yyyy-mm) so it can be shared.
  const currentMonth = monthStart(today);
  const lastMonth = addMonths(currentMonth, MAX_MONTHS_AHEAD);
  const [monthParam, setMonthParam] = useUrlParam("month");
  const month = shownMonth(monthParam, currentMonth, lastMonth);
  const setMonth = (next: string) => setMonthParam(next === currentMonth ? null : next.slice(0, 7));
  // The shared filters (in the URL), applied in the browser.
  const { filters } = useFilters("client");
  const filtered = useMemo(() => events.filter(matcher(filters, today)), [events, filters, today]);
  const facets = useMemo(() => facetCounts(events, filters, today), [events, filters, today]);

  // This month starts at the current week: whole weeks already over are only noise.
  const days = monthGrid(month).filter((d, i, all) => month !== currentMonth || all[i - (i % 7) + 6] >= today);
  const summaries = summarizeDays(filtered, days);
  const monthKey = month.slice(0, 7);
  const inMonth = filtered.filter((e) => e.startDay.slice(0, 7) <= monthKey && e.endDay.slice(0, 7) >= monthKey);

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
            const { total, kinds } = summaries.get(day) ?? { total: 0, kinds: [] };
            const outside = day.slice(0, 7) !== monthKey;
            const isToday = day === today;
            const isPast = day < today;
            const shown = kinds.slice(0, kinds.length > MAX_KINDS ? MAX_KINDS - 1 : MAX_KINDS);
            return (
              <div
                key={day}
                className={cn(
                  "group relative flex min-h-20 flex-col gap-1 border-r border-b p-1 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                  outside && "bg-background/40",
                )}
              >
                {/* The whole cell opens the day; the kind rows on top open it with that kind picked. */}
                <Link
                  href={dayHref(day, filters)}
                  aria-label={`${formatDay(day)}, ${total === 1 ? "1 event" : `${total} events`}`}
                  className="hover:bg-accent/30 absolute inset-0 rounded-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
                />
                <span className="pointer-events-none relative flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      (outside || isPast) && "text-muted-foreground",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {total > 0 && (
                    <span className="text-muted-foreground pr-0.5 text-[11px] tabular-nums max-sm:hidden">{total}</span>
                  )}
                </span>

                {/* Phones: a dot per kind and the total. Larger screens: a row per kind with its count. */}
                {total > 0 && (
                  <div className="pointer-events-none relative flex flex-col items-center gap-0.5 sm:hidden">
                    <span className="flex flex-wrap justify-center gap-0.5">
                      {kinds.slice(0, 4).map((k) => (
                        <span key={k.category} className="size-1.5 rounded-full" style={{ background: CATEGORY_COLORS[k.category] }} />
                      ))}
                    </span>
                    <span className="text-muted-foreground text-[10px] leading-none tabular-nums">{total}</span>
                  </div>
                )}
                <ul className="relative hidden min-w-0 flex-col sm:flex">
                  {shown.map((k) => (
                    <li key={k.category}>
                      <Link
                        href={dayHref(day, filters, k.category)}
                        className="hover:bg-accent/70 flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-[11px] leading-tight transition-colors"
                      >
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[k.category] }} />
                        <span className="truncate">{CATEGORY_LABELS[k.category]}</span>
                        <span className="text-muted-foreground ml-auto shrink-0 tabular-nums">{k.count}</span>
                      </Link>
                    </li>
                  ))}
                  {kinds.length > shown.length && (
                    <li>
                      <Link
                        href={dayHref(day, filters)}
                        className="text-muted-foreground hover:text-foreground block px-1 py-0.5 text-[11px] font-medium"
                      >
                        +{kinds.length - shown.length} more kinds
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
