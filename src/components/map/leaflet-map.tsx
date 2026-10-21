"use client";

import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";

import type { DivIcon, LocationEvent, Map as LeafletMapInstance, Marker, MarkerClusterGroup, MarkerOptions } from "leaflet";
import { Crosshair, LocateFixed, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { eventHref } from "@/lib/events/event-href";
import type { MapEvent } from "@/lib/events/view-types";
import { cn } from "@/lib/utils";

import { addBasemap } from "./basemap";

const MALMO_CENTER: [number, number] = [55.6, 13.0];
/** From this zoom up every venue has its own pin; below it nearby venues merge into a bubble. */
const UNCLUSTER_ZOOM = 15;

type Leaflet = typeof import("leaflet");
type PinInfo = { color: string; count: number };

/**
 * Teardrop pin coloured by category with an emoji glyph, plus a count badge
 * when several events share a venue. Only trusted values (colour, emoji,
 * number) go into this HTML; event text never does.
 */
function pinIcon(L: Leaflet, color: string, emoji: string, count: number, selected = false): DivIcon {
  const badge = count > 1 ? `<span class="mev-pin-count">${count}</span>` : "";
  return L.divIcon({
    className: selected ? "mev-pin-wrap is-selected" : "mev-pin-wrap",
    html: `<div class="mev-pin" style="--pin:${color}"><span class="mev-pin-glyph">${emoji}</span></div>${badge}`,
    iconSize: [32, 32],
    // The rotated square's sharp corner sits 16·√2 ≈ 23px below its centre.
    iconAnchor: [16, 39],
    popupAnchor: [0, -36],
    tooltipAnchor: [0, -36],
  });
}

/**
 * Bubble for a group of nearby venues: the event count, ringed by the
 * categories inside it in proportion to how many events each has.
 */
function clusterIcon(L: Leaflet, pins: PinInfo[]): DivIcon {
  const byColor = new Map<string, number>();
  let total = 0;
  for (const { color, count } of pins) {
    byColor.set(color, (byColor.get(color) ?? 0) + count);
    total += count;
  }
  let at = 0;
  const stops = [...byColor.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color, n]) => {
      const from = (at / total) * 360;
      at += n;
      return `${color} ${from}deg ${(at / total) * 360}deg`;
    });
  const size = total >= 50 ? 52 : total >= 10 ? 44 : 38;
  return L.divIcon({
    className: "mev-cluster-wrap",
    html: `<div class="mev-cluster" style="--ring:conic-gradient(${stops.join(",")});width:${size}px;height:${size}px"><span>${total}</span></div>`,
    iconSize: [size, size],
  });
}

/** Build popup content with DOM APIs so upstream text is never parsed as HTML. */
function popupContent(events: MapEvent[]) {
  const root = document.createElement("div");
  root.className = "malevents-popup";
  const header = document.createElement("div");
  header.className = "malevents-popup-header";
  const venue = document.createElement("p");
  venue.className = "malevents-popup-venue";
  venue.textContent = events[0].venueName;
  header.append(venue);
  if (events.length > 1) {
    const count = document.createElement("span");
    count.className = "malevents-popup-count";
    count.textContent = `${events.length} events`;
    header.append(count);
  }
  root.append(header);

  const list = document.createElement("div");
  list.className = "malevents-popup-list";
  for (const e of events) {
    const item = document.createElement("a");
    // The in-app event page; the venue's own link is one tap further, on that page.
    item.href = eventHref(e.id);
    item.className = "malevents-popup-item";
    item.style.setProperty("--cat", e.color);

    const glyph = document.createElement("span");
    glyph.className = "malevents-popup-glyph";
    glyph.textContent = e.emoji;
    const text = document.createElement("span");
    text.className = "malevents-popup-text";
    const title = document.createElement("strong");
    title.textContent = e.title;
    const meta = document.createElement("span");
    meta.textContent = [e.timeLabel, e.priceLabel, e.categoryLabel].filter(Boolean).join(" · ");
    text.append(title, meta);
    item.append(glyph, text);
    list.append(item);
  }
  root.append(list);
  return root;
}

export function LeafletMap({
  events,
  selectedId,
  onSelect,
  padding = { top: 48, bottom: 48 },
}: {
  events: MapEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Space kept clear of pins and popups at the top and bottom, e.g. under floating controls. */
  padding?: { top: number; bottom: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const markersRef = useRef(new Map<string, { marker: Marker; event: MapEvent; count: number }>());
  const leafletRef = useRef<Leaflet | null>(null);
  const fitRef = useRef<() => void>(() => {});
  const meRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const [locating, setLocating] = useState<"idle" | "busy" | "failed">("idle");
  const { top: padTop, bottom: padBottom } = padding;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Popup links are plain DOM anchors (Leaflet builds the popups). Route them
  // through the app router so the event opens as a sheet over the map instead
  // of reloading the page; modified clicks still open a new tab.
  const router = useRouter();
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onClick(e: MouseEvent) {
      const link = (e.target as Element).closest<HTMLAnchorElement>("a.malevents-popup-item");
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      router.push(link.getAttribute("href")!);
    }
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [router]);

  // Create the map once. Leaflet touches `window`, so it's imported lazily on the client.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Use Leaflet's own (extensible) object, not the frozen module namespace:
      // the cluster plugin is a classic script that adds itself to the global `L`.
      const mod = await import("leaflet");
      const L = ((mod as { default?: Leaflet }).default ?? mod) as Leaflet;
      (window as unknown as { L: Leaflet }).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false, zoomSnap: 0.5, minZoom: 9, maxZoom: 19 }).setView(MALMO_CENTER, 13);
      map.attributionControl.setPrefix(false);
      mapRef.current = map;
      clusterRef.current = L.markerClusterGroup({
        maxClusterRadius: 48,
        disableClusteringAtZoom: UNCLUSTER_ZOOM,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: false,
        iconCreateFunction: (cluster) =>
          clusterIcon(
            L,
            cluster.getAllChildMarkers().map((m) => (m.options as { pin?: PinInfo }).pin ?? { color: "#888", count: 1 }),
          ),
      }).addTo(map);
      // Trigger the markers effect now that the map exists.
      containerRef.current.dispatchEvent(new Event("leaflet-ready"));
      await addBasemap(L, map, () => !cancelled && mapRef.current === map);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
      meRef.current = null;
    };
  }, []);

  // Draw one marker per venue for the selected days.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function draw() {
      const L = leafletRef.current;
      const map = mapRef.current;
      const cluster = clusterRef.current;
      if (!L || !map || !cluster) return;

      cluster.clearLayers();
      markersRef.current.clear();
      // Touch screens have no hover, and a tap would show the tooltip on top of the popup.
      const canHover = window.matchMedia("(hover: hover)").matches;

      const byVenue = new Map<string, MapEvent[]>();
      for (const e of events) {
        const key = `${e.lat.toFixed(5)},${e.lng.toFixed(5)}`;
        byVenue.set(key, [...(byVenue.get(key) ?? []), e]);
      }

      const markers: Marker[] = [];
      for (const group of byVenue.values()) {
        const [first] = group;
        const pin: PinInfo = { color: first.color, count: group.length };
        const marker = L.marker([first.lat, first.lng], {
          icon: pinIcon(L, first.color, first.emoji, group.length),
          riseOnHover: true,
          pin,
        } as MarkerOptions)
          .bindPopup(popupContent(group), {
            maxWidth: 300,
            minWidth: 240,
            // Busy venues scroll inside the popup instead of growing past a phone screen.
            maxHeight: 320,
            autoPanPaddingTopLeft: [16, padTop],
            autoPanPaddingBottomRight: [64, padBottom],
          })
          .on("click", () => onSelectRef.current(first.id));
        if (canHover) {
          // Leaflet treats string tooltips as HTML, so pass a text-only element.
          const tooltip = document.createElement("span");
          tooltip.textContent = group.length > 1 ? `${first.venueName} (${group.length})` : first.title;
          marker.bindTooltip(tooltip, { direction: "top" });
        }
        markers.push(marker);
        for (const e of group) markersRef.current.set(e.id, { marker, event: first, count: group.length });
      }
      cluster.addLayers(markers);

      fitRef.current = () => {
        if (events.length > 0) {
          map.fitBounds(L.latLngBounds(events.map((e) => [e.lat, e.lng])), {
            paddingTopLeft: [48, padTop],
            paddingBottomRight: [48, padBottom],
            maxZoom: UNCLUSTER_ZOOM,
          });
        } else {
          map.setView(MALMO_CENTER, 13);
        }
      };
      fitRef.current();
    }

    draw();
    container.addEventListener("leaflet-ready", draw);
    return () => container.removeEventListener("leaflet-ready", draw);
  }, [events, padTop, padBottom]);

  // Fly to the selected event's venue, open its popup and ring the pin with a pulse.
  useEffect(() => {
    if (!selectedId) return;
    const entry = markersRef.current.get(selectedId);
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!entry || !L || !map) return;
    const { marker, event, count } = entry;
    // Swapping the icon (not toggling a class) survives the pin being re-added when clusters change.
    marker.setIcon(pinIcon(L, event.color, event.emoji, count, true));
    // Open the popup once the flight ends, so its auto-pan works from the final view.
    const open = () => marker.openPopup();
    map.once("moveend", open);
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), UNCLUSTER_ZOOM), { duration: 0.6 });
    return () => {
      map.off("moveend", open);
      marker.setIcon(pinIcon(L, event.color, event.emoji, count));
    };
  }, [selectedId, events]);

  function locate() {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    setLocating("busy");
    map
      .once("locationfound", (e: LocationEvent) => {
        setLocating("idle");
        const icon = L.divIcon({ className: "mev-me-wrap", html: '<span class="mev-me"></span>', iconSize: [18, 18] });
        if (meRef.current) meRef.current.setLatLng(e.latlng);
        else meRef.current = L.marker(e.latlng, { icon, keyboard: false, interactive: false, zIndexOffset: 1000 }).addTo(map);
        map.flyTo(e.latlng, Math.max(map.getZoom(), 14), { duration: 0.6 });
      })
      .once("locationerror", () => setLocating("failed"));
    map.locate({ enableHighAccuracy: true, timeout: 10000 });
  }

  const button =
    "bg-popover/85 text-foreground hover:bg-accent flex size-10 items-center justify-center rounded-xl border shadow-lg backdrop-blur-md transition-colors disabled:opacity-60";

  return (
    <div className="relative isolate size-full">
      <div ref={containerRef} className="malevents-map size-full bg-[#45516e]" role="region" aria-label="Event map" />
      {/* Soft vignette so the map's edges melt into the dark card around it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_48px_rgb(0_0_0/45%)]" />
      <div className="absolute right-3 bottom-8 z-20 flex flex-col gap-2 max-lg:bottom-[calc(var(--sheet-h,0px)+2rem)] max-lg:transition-[bottom] max-lg:duration-300">
        <button
          type="button"
          className={cn(button, locating === "failed" && "text-destructive")}
          onClick={locate}
          disabled={locating === "busy"}
          aria-label={locating === "failed" ? "Location unavailable, try again" : "Show my location"}
          title={locating === "failed" ? "Location unavailable" : "Near me"}
        >
          <LocateFixed className={cn("size-4.5", locating === "busy" && "animate-pulse")} />
        </button>
        <button type="button" className={button} onClick={() => fitRef.current()} aria-label="Show all events" title="Show all events">
          <Crosshair className="size-4.5" />
        </button>
        <div className="bg-popover/85 flex flex-col overflow-hidden rounded-xl border shadow-lg backdrop-blur-md max-lg:hidden">
          <button type="button" className="hover:bg-accent flex size-10 items-center justify-center" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">
            <Plus className="size-4.5" />
          </button>
          <span aria-hidden className="bg-border h-px" />
          <button type="button" className="hover:bg-accent flex size-10 items-center justify-center" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">
            <Minus className="size-4.5" />
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {locating === "failed" ? "Your location is unavailable." : ""}
      </p>
    </div>
  );
}
