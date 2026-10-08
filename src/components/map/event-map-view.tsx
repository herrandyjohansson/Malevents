"use client";

import { MapPin, MapPinOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { LeafletMap } from "./leaflet-map";
import type { MapDay } from "./types";

export function EventMapView({ days, unplacedCount }: { days: MapDay[]; unplacedCount: number }) {
  const [selectedDay, setSelectedDay] = useState(
    () => (days.find((d) => d.events.length > 0) ?? days[0]).day,
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const current = days.find((d) => d.day === selectedDay) ?? days[0];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 pb-1 sm:mx-0 sm:px-0">
        {days.map((d) => {
          const active = d.day === selectedDay;
          return (
            <button
              key={d.day}
              role="tab"
              aria-selected={active}
              aria-label={`${d.label}, ${d.events.length} events`}
              disabled={d.events.length === 0}
              onClick={() => {
                setSelectedDay(d.day);
                setSelectedEventId(null);
              }}
              className={cn(
                "bg-card hover:border-primary/50 relative flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                active && "border-primary bg-primary/15 shadow-[0_0_24px_-8px] shadow-primary",
              )}
            >
              <span className="text-muted-foreground text-[10px] font-medium uppercase">{d.weekday}</span>
              <span className="text-lg leading-none font-semibold">{d.dayOfMonth}</span>
              <span className="text-muted-foreground text-[10px] uppercase">{d.month}</span>
              {d.events.length > 0 && (
                <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                  {d.events.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="bg-card flex max-h-[65vh] flex-col overflow-hidden rounded-xl border max-lg:order-2">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">{current.label}</h2>
            <p className="text-muted-foreground text-sm">
              {current.events.length === 1 ? "1 event" : `${current.events.length} events`}
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {current.events.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelectedEventId(e.id)}
                  aria-pressed={selectedEventId === e.id}
                  className={cn(
                    "hover:bg-accent flex w-full gap-3 rounded-lg p-3 text-left transition-colors",
                    selectedEventId === e.id && "bg-accent ring-primary/50 ring-1",
                  )}
                >
                  <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
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

        <div className="h-[65vh] min-h-[360px] overflow-hidden rounded-xl border max-lg:order-1">
          <LeafletMap events={current.events} selectedId={selectedEventId} onSelect={setSelectedEventId} />
        </div>
      </div>
    </div>
  );
}
