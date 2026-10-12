"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LeafletMap } from "./leaflet-map";
import { MapLegend } from "./map-legend";
import type { MapEvent } from "./types";

export function WeekMapCard({ events }: { events: MapEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="bg-card/80 flex flex-col overflow-hidden rounded-2xl border shadow-[0_20px_60px_-30px] shadow-primary/40 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="font-semibold">This week on the map</h2>
          <p className="text-muted-foreground text-xs">
            {events.length === 1 ? "1 event" : `${events.length} events`} in the next 7 days
          </p>
        </div>
        <Link href="/map" className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline">
          Full map
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="h-72 border-y">
        <LeafletMap events={events} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div className="px-4 py-3">
        <MapLegend events={events} />
      </div>
    </div>
  );
}
