"use client";

import { MapPin, MapPinOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

import { FilterBar } from "@/components/filters/filter-bar";
import { useFilters } from "@/components/filters/use-filters";
import { addMonths, formatRange, rangeLength, type DayRange } from "@/lib/days";
import { facetCounts, filtersToParams, matcher, resolveRange } from "@/lib/events/filters";
import { cn } from "@/lib/utils";

import { LeafletMap } from "./leaflet-map";
import { MapLegend } from "./map-legend";
import { RangeCalendar } from "./range-calendar";
import type { MapEvent } from "./types";

// Tailwind's `lg` breakpoint. Below it the map fills the screen and the list
// becomes a bottom sheet you drag up.
const DESKTOP_QUERY = "(min-width: 64rem)";

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches, () => true);
}

type SheetSnap = "peek" | "half" | "full";
/** Height of the collapsed sheet: the handle plus the range and event count. */
const SHEET_PEEK = 92;
/** Room left above the fully open sheet so the date chips stay reachable. */
const SHEET_TOP_GAP = 64;

export function EventMapView({
  events,
  today,
  unplacedCount,
  sources,
}: {
  events: MapEvent[];
  today: string;
  unplacedCount: number;
  sources: { id: string; name: string }[];
}) {
  // The shared filters (in the URL) decide what's on the map; "any time" shows every upcoming event.
  const { filters, update } = useFilters("client");
  const range = resolveRange(filters, today);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const filterKey = filtersToParams(filters).toString();
  const visible = useMemo(() => events.filter(matcher(filters, today)), [events, filterKey, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const facets = useMemo(() => facetCounts(events, filters, today), [events, filterKey, today]); // eslint-disable-line react-hooks/exhaustive-deps
  // Page as far as the last known event, at least next month, at most a year out.
  const lastMonth = useMemo(() => {
    const latest = events.reduce((max, e) => (e.startDay > max ? e.startDay : max), addMonths(today, 1));
    const cap = addMonths(today, 12);
    return latest > cap ? cap : latest;
  }, [events, today]);
  const countFor = (day: string) => events.reduce((n, e) => (e.startDay <= day && e.endDay >= day ? n + 1 : n), 0);

  // Bottom sheet (phones only). Its height snaps between peek, half and full,
  // and follows the finger while you drag its header.
  const viewRef = useRef<HTMLDivElement>(null);
  const [viewHeight, setViewHeight] = useState(0);
  const [snap, setSnap] = useState<SheetSnap>("peek");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragRef = useRef<{ y: number; height: number; time: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setViewHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fullHeight = Math.max(viewHeight - SHEET_TOP_GAP, SHEET_PEEK);
  const snaps: Record<SheetSnap, number> = {
    peek: SHEET_PEEK,
    half: Math.max(Math.round(viewHeight * 0.5), SHEET_PEEK),
    full: fullHeight,
  };
  const sheetHeight = dragHeight ?? snaps[snap];

  function onSheetPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (isDesktop || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { y: e.clientY, height: sheetHeight, time: e.timeStamp, moved: false };
  }

  function onSheetPointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = drag.y - e.clientY;
    if (!drag.moved && Math.abs(dy) < 6) return;
    drag.moved = true;
    setDragHeight(Math.min(Math.max(drag.height + dy, SHEET_PEEK), fullHeight));
  }

  function onSheetPointerUp(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) return;
    suppressClickRef.current = true;
    // Throw the sheet a little in the direction of a flick, then snap to the closest stop.
    const dy = drag.y - e.clientY;
    const velocity = dy / Math.max(e.timeStamp - drag.time, 1);
    const projected = drag.height + dy + velocity * 180;
    const nearest = (Object.keys(snaps) as SheetSnap[]).reduce((best, s) =>
      Math.abs(snaps[s] - projected) < Math.abs(snaps[best] - projected) ? s : best,
    );
    setSnap(nearest);
    setDragHeight(null);
  }

  function toggleSheet() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (isDesktop) return;
    setSnap((s) => (s === "peek" ? "half" : "peek"));
  }

  function select(next: DayRange) {
    setSelectedEventId(null);
    update({ when: "custom", from: next.from < today ? today : next.from, to: next.to });
  }

  function pickEvent(id: string) {
    setSelectedEventId(id);
    // On a phone, lower the sheet so the map can show where the event is.
    if (!isDesktop) setSnap("peek");
  }

  const days = range ? rangeLength(range) : 0;
  const sheetOpen = snap !== "peek";
  const filterBarProps = { mode: "client" as const, facets, sources, today, lastMonth, countFor, noun: "events on the map" };

  return (
    <div
      ref={viewRef}
      className="flex flex-col gap-4 max-lg:fixed max-lg:inset-x-0 max-lg:top-14 max-lg:bottom-(--tabbar-h) max-lg:overflow-hidden"
      style={{ "--sheet-h": `${sheetHeight}px` } as React.CSSProperties}
    >
      <FilterBar {...filterBarProps} datePicker={false} className="max-lg:hidden" />
      {/* Phone: filter chips float over the top of the map. */}
      <FilterBar {...filterBarProps} variant="floating" className="absolute inset-x-0 top-0 z-30 px-3 py-3 lg:hidden" />

      <div className="grid gap-4 max-lg:relative max-lg:h-full lg:h-[72vh] lg:grid-cols-[340px_1fr] lg:grid-rows-[auto_minmax(0,1fr)]">
        {/* Desktop: drag across days to set a date range. On phones the filter panel has the same calendar. */}
        <section
          aria-label="Pick dates"
          className="bg-card flex flex-col gap-3 rounded-2xl border p-3 max-lg:hidden lg:col-start-1 lg:row-start-1"
        >
          <RangeCalendar today={today} lastMonth={lastMonth} value={range} onChange={select} countFor={countFor} />
        </section>

        <div className="flex h-[60vh] min-h-[360px] flex-col gap-3 max-lg:absolute max-lg:inset-0 max-lg:h-auto max-lg:min-h-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full">
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border max-lg:rounded-none max-lg:border-0">
            <LeafletMap
              events={visible}
              selectedId={selectedEventId}
              onSelect={pickEvent}
              padding={isDesktop ? { top: 48, bottom: 48 } : { top: 72, bottom: SHEET_PEEK + 24 }}
            />
          </div>
          <div className="max-lg:hidden">
            <MapLegend events={visible} />
          </div>
        </div>

        <aside
          className={cn(
            "bg-card flex max-h-[60vh] min-h-0 flex-col overflow-hidden rounded-2xl border lg:col-start-1 lg:row-start-2 lg:max-h-none",
            "max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-10 max-lg:h-(--sheet-h) max-lg:max-h-none",
            "max-lg:rounded-b-none max-lg:rounded-t-2xl max-lg:border-x-0 max-lg:border-b-0 max-lg:shadow-[0_-12px_40px_-12px_rgb(0_0_0/70%)]",
            dragHeight === null && "max-lg:transition-[height] max-lg:duration-300 max-lg:ease-[cubic-bezier(0.32,0.72,0,1)]",
          )}
        >
          <div
            className="border-b px-4 py-3 max-lg:cursor-grab max-lg:select-none max-lg:touch-none max-lg:pt-2 max-lg:active:cursor-grabbing"
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerUp}
            onPointerCancel={() => {
              dragRef.current = null;
              setDragHeight(null);
            }}
            onClick={toggleSheet}
          >
            <button
              type="button"
              aria-expanded={sheetOpen}
              aria-label={sheetOpen ? "Hide event list" : "Show event list"}
              className="mx-auto mb-2 flex h-4 w-full items-center justify-center lg:hidden"
            >
              <span aria-hidden className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
            </button>
            <h2 className="font-semibold" aria-live="polite">
              {filters.when === "tonight" ? "Tonight" : range ? formatRange(range) : "All upcoming events"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {visible.length === 1 ? "1 event" : `${visible.length} events`}
              {days > 1 && ` over ${days} days`}
            </p>
          </div>
          {visible.length === 0 && (
            <p className="text-muted-foreground px-4 py-6 text-sm">
              Nothing on the map for these filters. Try other dates or remove a filter.
            </p>
          )}
          <ul className="flex-1 overflow-y-auto overscroll-contain p-2">
            {visible.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => pickEvent(e.id)}
                  aria-pressed={selectedEventId === e.id}
                  className={cn(
                    "hover:bg-accent flex w-full gap-3 rounded-lg p-3 text-left transition-colors",
                    selectedEventId === e.id && "bg-accent ring-primary/50 ring-1",
                  )}
                >
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-sm"
                    style={{ background: e.color }}
                  >
                    {e.emoji}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="line-clamp-2 text-sm font-medium">{e.title}</span>
                    <span className="text-muted-foreground text-xs">{e.timeLabel}</span>
                    <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                      <MapPin className="size-3 shrink-0" />
                      {e.venueName}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {unplacedCount > 0 && (
            <p className="text-muted-foreground flex items-center gap-2 border-t px-4 py-2.5 text-xs max-lg:pb-[max(0.625rem,env(safe-area-inset-bottom))]">
              <MapPinOff className="size-3.5 shrink-0" />
              {unplacedCount} upcoming {unplacedCount === 1 ? "event has" : "events have"} no known location.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
