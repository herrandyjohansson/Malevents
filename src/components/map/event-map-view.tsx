"use client";

import { MapPin, MapPinOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { LeafletMap } from "./leaflet-map";
import { MapLegend } from "./map-legend";
import type { MapView } from "./types";

export function EventMapView({ views, unplacedCount }: { views: MapView[]; unplacedCount: number }) {
  const [selectedKey, setSelectedKey] = useState(views[0].key);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const current = views.find((v) => v.key === selectedKey) ?? views[0];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Date range" className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-2 pb-1 sm:mx-0 sm:px-0">
        {views.map((v) => {
          const active = v.key === selectedKey;
          return (
            <button
              key={v.key}
              role="tab"
              aria-selected={active}
              aria-label={`${v.label}, ${v.events.length} events`}
              disabled={v.events.length === 0}
              onClick={() => {
                setSelectedKey(v.key);
                setSelectedEventId(null);
              }}
              className={cn(
                "bg-card hover:border-primary/50 relative flex h-16 shrink-0 flex-col items-center justify-center rounded-lg border text-center transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                v.kind === "week" ? "w-20" : "w-14",
                active && "border-primary bg-primary/15 shadow-[0_0_24px_-8px] shadow-primary",
              )}
            >
              <span className="text-muted-foreground text-[10px] font-medium uppercase">{v.top}</span>
              <span className="text-lg leading-none font-semibold">{v.middle}</span>
              <span className="text-muted-foreground text-[10px] uppercase">{v.bottom}</span>
              {v.events.length > 0 && (
                <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                  {v.events.length}
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

        <div className="flex flex-col gap-3 max-lg:order-1">
          <div className="h-[65vh] min-h-[360px] overflow-hidden rounded-xl border">
            <LeafletMap events={current.events} selectedId={selectedEventId} onSelect={setSelectedEventId} />
          </div>
          <MapLegend events={current.events} />
        </div>
      </div>
    </div>
  );
}
