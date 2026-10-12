import type { Map as LeafletMapInstance } from "leaflet";
import type { StyleSpecification } from "maplibre-gl";

type Leaflet = typeof import("leaflet");

// OpenMapTiles' Fiord Color style (github.com/openmaptiles/fiord-color-gl-style),
// served by OpenFreeMap: free vector tiles with no API key, no sign-up and no
// usage cap (https://openfreemap.org). The upstream style.json points at
// MapTiler, which needs a key, so we use OpenFreeMap's hosted copy instead.
// Drawn with WebGL through MapLibre.
const STYLE_URL = "https://tiles.openfreemap.org/styles/fiord";
const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

// Fallback when WebGL or OpenFreeMap is unavailable: the standard OSM raster
// tiles (allowed for low-traffic sites showing the attribution), darkened in
// globals.css via the .mev-osm-tiles class.
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Add the basemap under the pins: OpenFreeMap vector tiles when the browser can
 * draw them, plain OSM raster tiles otherwise. Resolves once a layer is added.
 */
export async function addBasemap(L: Leaflet, map: LeafletMapInstance, isAlive: () => boolean) {
  if (supportsWebGL()) {
    try {
      const [{ maplibreGL }, style] = await Promise.all([
        import("@maplibre/maplibre-gl-leaflet"),
        fetch(STYLE_URL).then((res) => {
          if (!res.ok) throw new Error(`Basemap style: HTTP ${res.status}`);
          return res.json() as Promise<StyleSpecification>;
        }),
      ]);
      if (!isAlive()) return;
      // Leaflet owns the attribution control, so MapLibre's own is switched off.
      maplibreGL({ style, attributionControl: false }).addTo(map);
      map.attributionControl.addAttribution(VECTOR_ATTRIBUTION);
      return;
    } catch {
      // Fall through to raster tiles.
    }
  }
  if (!isAlive()) return;
  L.tileLayer(OSM_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19, className: "mev-osm-tiles" }).addTo(map);
}
