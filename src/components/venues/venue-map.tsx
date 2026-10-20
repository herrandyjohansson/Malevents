"use client";

import { useState } from "react";

import { LeafletMap } from "@/components/map/leaflet-map";
import type { MapEvent } from "@/lib/events/view-types";

export function VenueMap({ events }: { events: MapEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <LeafletMap events={events} selectedId={selectedId} onSelect={setSelectedId} />;
}
