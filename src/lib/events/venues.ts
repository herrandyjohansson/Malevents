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
  babel: [55.5933, 13.0007],
  "grand malmö": [55.5955, 12.999],
  // Added 2026-10-21 for the city calendar, Konsthall, Skånes Dansteater and
  // Plan B sources; coordinates from OpenStreetMap Nominatim.
  stadsbiblioteket: [55.6001, 12.9929],
  "malmö museum": [55.6048, 12.9881],
  victoriateatern: [55.5992, 13.0012],
  kirsebergsbiblioteket: [55.6113, 13.0432],
  lindängenbiblioteket: [55.5594, 13.0149],
  oxiebiblioteket: [55.5397, 13.0962],
  "malmö konsthall": [55.5953, 12.9994],
  "skånes dansteater": [55.6162, 12.9853],
  "plan b": [55.5839, 13.0272],
  bellevuegårdsbiblioteket: [55.5813, 12.9768],
  husiebiblioteket: [55.5909, 13.0709],
  "katrinetorp landeri": [55.5508, 13.0054],
  "baltiska hallen": [55.5836, 12.9916],
  ribersborgsstranden: [55.6021, 12.9666],
  "limhamns kalkbrott": [55.5676, 12.9333],
  "arena 305": [55.5849, 13.0177],
  // Added 2026-10-24 for the Spegeln, Medley and Hypnos sources (find-malmo-event-source);
  // coordinates from OpenStreetMap Nominatim.
  "biograf spegeln": [55.6054, 13.0007],
  spegeln: [55.6054, 13.0007],
  medley: [55.6034, 13.0066],
  "hypnos theatre": [55.5856, 13.0261],
  // Other names the city calendar uses for venues already listed above.
  "intiman (malmö stadsteater)": [55.5986, 12.9905],
  "hipp (malmö stadsteater)": [55.6005, 13.0028],
  "biograf panora": [55.5921, 13.0057],
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

/** URL-safe slug that keeps Swedish letters readable: "Malmö Opera" → "malmo-opera". */
export function venueSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Other names listings use for a venue, checked by hand (duplicate audit,
 * 24 Oct 2026). A name that points at one room keeps the room in the
 * address, so the event still says where in the building it is. Venues
 * that merely share a building or street (Malmö Opera and Intiman,
 * Folkets Park and Moriska Paviljongen) stay apart: add a name here only
 * when it is the same place. Old venue pages redirect (next.config.ts).
 */
const VENUE_ALIASES: { alias: string; name: string; room?: string }[] = [
  { alias: "Slagthusets Teater", name: "Slagthuset", room: "Teatern" },
  { alias: "Slagthuset Nöje & Event", name: "Slagthuset" },
  { alias: "Slagthuset - Restaurang", name: "Slagthuset", room: "Restaurang" },
  { alias: "Slagthuset - Saluhallen", name: "Slagthuset", room: "Saluhallen" },
  { alias: "Malmö Live", name: "Malmö Live Konserthus" },
  { alias: "Biograf Panora", name: "Panora" },
  { alias: "Hipp (Malmö stadsteater)", name: "Hippodromen, Malmö Stadsteater" },
  { alias: "Intiman (Malmö Stadsteater)", name: "Intiman, Malmö Stadsteater" },
  { alias: "Folkets Park - Moriska Paviljongen", name: "Moriska Paviljongen" },
  { alias: "Hyllie Bryggeri AB", name: "Hyllie Bryggeri" },
  // Tickster's place text for Medley's own events.
  { alias: "medley – musik", name: "Medley" },
  { alias: "Dansstationen på Palladium", name: "Dansstationen" },
  { alias: "Radisson Blu Hotel", name: "Radisson Blu Hotel Malmö" },
];

const ALIAS_BY_KEY = new Map(VENUE_ALIASES.map((a) => [key(a.alias), a]));

/** The event with its venue under the venue's own name (see VENUE_ALIASES); unchanged when it already is. */
export function withCanonicalVenue(event: MalmoEvent): MalmoEvent {
  const venue = event.venue;
  const alias = venue && ALIAS_BY_KEY.get(key(venue.name));
  if (!venue || !alias) return event;
  const address = alias.room ? [alias.room, venue.address].filter(Boolean).join(", ") : venue.address;
  return withCoordinates({ ...event, venue: { ...venue, name: alias.name, address } });
}

/** The other names of a venue, so searching for an old name still finds it. */
export function venueAliasNames(name: string) {
  return VENUE_ALIASES.filter((a) => key(a.name) === key(name)).map((a) => a.alias);
}

/** Permanent redirects from an alias's venue page to the venue's page (used in next.config.ts). */
export function venueAliasRedirects() {
  return VENUE_ALIASES.map((a) => ({
    source: `/venues/${venueSlug(a.alias)}`,
    destination: `/venues/${venueSlug(a.name)}`,
    permanent: true,
  })).filter((r) => r.source !== r.destination);
}
