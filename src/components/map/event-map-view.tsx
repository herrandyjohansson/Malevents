"use client";

import { MapPin, MapPinOff } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { addDays, addMonths, formatRange, rangeLength, weekend, type DayRange } from "./days";
import { LeafletMap } from "./leaflet-map";
import { MapLegend } from "./map-legend";
import { RangeCalendar } from "./range-calendar";
import type { MapEvent } from "./types";

function overlaps(e: MapEvent, range: DayRange) {
  return e.startDay <= range.to && e.endDay >= range.from;
}

export function EventMapView({
  events,
  today,
  initialRange,
  unplacedCount,
}: {
  events: MapEvent[];
  today: string;
  initialRange?: DayRange;
  unplacedCount: number;
}) {
  const presets = useMemo(
    () => [
      { label: "Today", range: { from: today, to: today } },
      { label: "This weekend", range: weekend(today) },
      { label: "Next 7 days", range: { from: today, to: addDays(today, 6) } },
      { label: "This month", range: { from: today, to: addDays(addMonths(today, 1), -1) } },
    ],
    [today],
  );
  const [range, setRange] = useState<DayRange>(() =>
    initialRange ? { from: initialRange.from < today ? today : initialRange.from, to: initialRange.to } : presets[2].range,
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const visible = useMemo(() => events.filter((e) => overlaps(e, range)), [events, range]);
  // Page as far as the last known event, at least next month, at most a year out.
  const lastMonth = useMemo(() => {
    const latest = events.reduce((max, e) => (e.startDay > max ? e.startDay : max), addMonths(today, 1));
    const cap = addMonths(today, 12);
    return latest > cap ? cap : latest;
  }, [events, today]);

  function select(next: DayRange) {
    const from = next.from < today ? today : next.from;
    setRange({ from, to: next.to });
    setSelectedEventId(null);
    // Keep the pick in the URL so it survives a reload and can be shared.
    window.history.replaceState(null, "", `?from=${from}&to=${next.to}`);
  }

  const days = rangeLength(range);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:h-[72vh] lg:grid-cols-[340px_1fr] lg:grid-rows-[auto_minmax(0,1fr)]">
        <section aria-label="Pick dates" className="bg-card flex flex-col gap-3 rounded-xl border p-3 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = p.range.from === range.from && p.range.to === range.to;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => select(p.range)}
                  className={cn(
                    "hover:border-primary/50 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    active && "border-primary bg-primary/15 text-foreground",
                    !active && "text-muted-foreground",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <RangeCalendar
            today={today}
            lastMonth={lastMonth}
            value={range}
            onChange={select}
            countFor={(day) => events.reduce((n, e) => (e.startDay <= day && e.endDay >= day ? n + 1 : n), 0)}
          />
        </section>

        <div className="flex h-[60vh] min-h-[360px] flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
            <LeafletMap events={visible} selectedId={selectedEventId} onSelect={setSelectedEventId} />
          </div>
          <MapLegend events={visible} />
        </div>

        <aside className="bg-card flex max-h-[60vh] min-h-0 flex-col overflow-hidden rounded-xl border lg:col-start-1 lg:row-start-2 lg:max-h-none">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold" aria-live="polite">
              {formatRange(range)}
            </h2>
            <p className="text-muted-foreground text-sm">
              {visible.length === 1 ? "1 event" : `${visible.length} events`}
              {days > 1 && ` over ${days} days`}
            </p>
          </div>
          {visible.length === 0 && (
            <p className="text-muted-foreground px-4 py-6 text-sm">
              Nothing on the map for these dates. Try a wider range.
            </p>
          )}
          <ul className="flex-1 overflow-y-auto p-2">
            {visible.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelectedEventId(e.id)}
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
            <p className="text-muted-foreground flex items-center gap-2 border-t px-4 py-2.5 text-xs">
              <MapPinOff className="size-3.5 shrink-0" />
              {unplacedCount} upcoming {unplacedCount === 1 ? "event has" : "events have"} no known location.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
