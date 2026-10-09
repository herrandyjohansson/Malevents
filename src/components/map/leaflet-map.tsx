"use client";

import "leaflet/dist/leaflet.css";

import type { LayerGroup, Map as LeafletMapInstance, Marker } from "leaflet";
import { useEffect, useRef } from "react";

import type { MapEvent } from "./types";

const MALMO_CENTER: [number, number] = [55.6, 13.0];

// Free basemap, no API key: the standard OpenStreetMap tiles, which the OSM tile
// usage policy allows for low-traffic sites that show the attribution. They are
// light, so globals.css darkens the tile pane to fit the dark theme.
// (CARTO's basemaps now show an "API key required" tile on deployed sites.)
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Teardrop pin coloured by category with an emoji glyph, plus a count badge
 * when several events share a venue. Only trusted values (colour, emoji,
 * number) go into this HTML; event text never does.
 */
function pinHtml(color: string, emoji: string, count: number) {
  const badge = count > 1 ? `<span class="mev-pin-count">${count}</span>` : "";
  return `<div class="mev-pin" style="--pin:${color}"><span class="mev-pin-glyph">${emoji}</span></div>${badge}`;
}

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
  const markersRef = useRef(new Map<string, Marker>());
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
      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
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
        const [{ lat, lng, color, emoji }] = group;
        const icon = L.divIcon({
          className: "mev-pin-wrap",
          html: pinHtml(color, emoji, group.length),
          iconSize: [32, 32],
          // The rotated square's sharp corner sits 16·√2 ≈ 23px below its centre.
          iconAnchor: [16, 39],
          popupAnchor: [0, -36],
          tooltipAnchor: [0, -36],
        });
        // Leaflet treats string tooltips as HTML, so pass a text-only element.
        const tooltip = document.createElement("span");
        tooltip.textContent = group.length > 1 ? `${group[0].venueName} (${group.length})` : group[0].title;
        const marker = L.marker([lat, lng], { icon, riseOnHover: true })
          .bindPopup(popupContent(group), { maxWidth: 280 })
          .bindTooltip(tooltip, { direction: "top" })
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
