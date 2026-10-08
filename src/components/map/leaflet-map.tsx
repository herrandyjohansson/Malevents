"use client";

import "leaflet/dist/leaflet.css";

import type { CircleMarker, LayerGroup, Map as LeafletMapInstance } from "leaflet";
import { useEffect, useRef } from "react";

import type { MapEvent } from "./types";

const MALMO_CENTER: [number, number] = [55.6, 13.0];

// Free basemap: CARTO "Dark Matter" tiles over OpenStreetMap data. No API key;
// attribution is required. Swap TILE_URL for any other XYZ tile server.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Build popup content with DOM APIs so upstream text is never parsed as HTML. */
function popupContent(events: MapEvent[]) {
  const root = document.createElement("div");
  root.className = "malevents-popup";
  const venue = document.createElement("p");
  venue.className = "malevents-popup-venue";
  venue.textContent = events[0].venueName;
  root.append(venue);

  for (const e of events) {
    const item = document.createElement("a");
    item.href = e.url;
    item.target = "_blank";
    item.rel = "noopener noreferrer";
    item.className = "malevents-popup-item";

    const title = document.createElement("strong");
    title.textContent = e.title;
    const meta = document.createElement("span");
    meta.textContent = [e.timeLabel, e.priceLabel, e.categoryLabel].filter(Boolean).join(" · ");
    meta.style.setProperty("--cat", e.color);
    item.append(title, meta);
    root.append(item);
  }
  return root;
}

export function LeafletMap({
  events,
  selectedId,
  onSelect,
}: {
  events: MapEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, CircleMarker>());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once. Leaflet touches `window`, so it's imported lazily on the client.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false }).setView(MALMO_CENTER, 13);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, subdomains: "abcd", maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      // Trigger the markers effect now that the map exists.
      containerRef.current.dispatchEvent(new Event("leaflet-ready"));
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw one marker per venue for the selected day.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function draw() {
      const L = leafletRef.current;
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!L || !map || !layer) return;

      layer.clearLayers();
      markersRef.current.clear();

      const byVenue = new Map<string, MapEvent[]>();
      for (const e of events) {
        const key = `${e.lat.toFixed(5)},${e.lng.toFixed(5)}`;
        byVenue.set(key, [...(byVenue.get(key) ?? []), e]);
      }

      for (const group of byVenue.values()) {
        const [{ lat, lng, color }] = group;
        const marker = L.circleMarker([lat, lng], {
          radius: 8 + Math.min(group.length - 1, 4) * 2,
          color: "#0f0f17",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
        })
          .bindPopup(popupContent(group), { maxWidth: 280 })
          .bindTooltip(group.length > 1 ? `${group[0].venueName} (${group.length})` : group[0].title, {
            direction: "top",
            offset: [0, -8],
          })
          .on("click", () => onSelectRef.current(group[0].id))
          .addTo(layer);
        for (const e of group) markersRef.current.set(e.id, marker);
      }

      if (events.length > 0) {
        map.fitBounds(
          L.latLngBounds(events.map((e) => [e.lat, e.lng])),
          { padding: [48, 48], maxZoom: 15 },
        );
      } else {
        map.setView(MALMO_CENTER, 13);
      }
    }

    draw();
    container.addEventListener("leaflet-ready", draw);
    return () => container.removeEventListener("leaflet-ready", draw);
  }, [events]);

  // Focus the selected event's marker.
  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker || !mapRef.current) return;
    mapRef.current.flyTo(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 15), { duration: 0.6 });
    marker.openPopup();
  }, [selectedId]);

  return <div ref={containerRef} className="malevents-map isolate size-full bg-[#0f0f17]" role="region" aria-label="Event map" />;
}
