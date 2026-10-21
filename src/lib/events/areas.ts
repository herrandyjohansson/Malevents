/**
 * Malmö areas by the names people use for a night out, not the city's
 * official districts. Each area has one or more centre points; a venue
 * belongs to the area with the nearest centre, within MAX_DISTANCE_KM.
 * Borders are approximate on purpose. Client-safe: the filters use it in
 * the browser.
 */

export const AREAS = [
  { id: "centrum", name: "Centrum", centres: [[55.6055, 13.0005]] },
  { id: "mollan", name: "Möllan", centres: [[55.591, 13.008]] },
  { id: "vastra-hamnen", name: "Västra Hamnen", centres: [[55.6135, 12.98]] },
  { id: "davidshall-triangeln", name: "Davidshall & Triangeln", centres: [[55.5955, 12.9975]] },
  {
    id: "rosengard-varnhem",
    name: "Rosengård & Värnhem",
    centres: [
      [55.5845, 13.04],
      [55.6035, 13.0235],
    ],
  },
  { id: "limhamn", name: "Limhamn", centres: [[55.581, 12.927]] },
  { id: "hyllie", name: "Hyllie", centres: [[55.5635, 12.976]] },
] as const satisfies readonly { id: string; name: string; centres: readonly (readonly [number, number])[] }[];

export type AreaId = (typeof AREAS)[number]["id"];

export const AREA_NAMES = Object.fromEntries(AREAS.map((a) => [a.id, a.name])) as Record<AreaId, string>;

/** Venues farther than this from every centre (outside Malmö, mostly) get no area. */
const MAX_DISTANCE_KM = 3;

/** Distance in km; flat-earth is accurate enough within one city. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = (lat2 - lat1) * 111.2;
  const dLng = (lng2 - lng1) * 111.2 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/** The area a point is in, or undefined when it is outside every area. */
export function areaAt(lat: number, lng: number): AreaId | undefined {
  let best: { id: AreaId; km: number } | undefined;
  for (const area of AREAS) {
    for (const [cLat, cLng] of area.centres) {
      const km = distanceKm(lat, lng, cLat, cLng);
      if (!best || km < best.km) best = { id: area.id, km };
    }
  }
  return best && best.km <= MAX_DISTANCE_KM ? best.id : undefined;
}

export function isAreaId(value: string): value is AreaId {
  return AREAS.some((a) => a.id === value);
}
