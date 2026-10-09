import type { MalmoEvent } from "./types";

/**
 * Coordinates for well-known Malmö venues, used when an upstream gives a
 * venue name but no coordinates. Extend as new venues show up in the admin
 * (events without coordinates are flagged there). A geocoder such as
 * OpenStreetMap Nominatim could fill gaps later, within its usage policy.
 */
const VENUES: Record<string, [lat: number, lng: number]> = {
  "malmö stadsbibliotek": [55.6001, 12.9929],
  "möllevångstorget": [55.5911, 13.0076],
  "turning torso": [55.6131, 12.9764],
  "folkets park": [55.5934, 13.0099],
  stortorget: [55.6060, 13.0006],
  garaget: [55.5888, 13.0207],
  "malmö live konserthus": [55.6084, 12.9942],
  "malmö live": [55.6084, 12.9942],
  "malmö arena": [55.5653, 12.9752],
  "eleda stadion": [55.5838, 12.9875],
  "malmö opera": [55.5986, 12.9905],
  "moderna museet malmö": [55.6036, 13.0037],
  panora: [55.5921, 13.0057],
  slagthuset: [55.6094, 13.0052],
  "moriska paviljongen": [55.5932, 13.0096],
  inkonst: [55.5966, 13.0004],
};

function key(name: string) {
  return name.trim().toLowerCase();
}

export function withCoordinates(event: MalmoEvent): MalmoEvent {
  const venue = event.venue;
  if (!venue || (venue.lat !== undefined && venue.lng !== undefined)) return event;
  const coords = VENUES[key(venue.name)];
  return coords ? { ...event, venue: { ...venue, lat: coords[0], lng: coords[1] } } : event;
}

export function hasCoordinates(event: MalmoEvent): boolean {
  return event.venue?.lat !== undefined && event.venue?.lng !== undefined;
}
