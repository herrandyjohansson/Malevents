import { describe, expect, it } from "vitest";

import type { MalmoEvent } from "./types";
import { venueAliasNames, venueAliasRedirects, venueSlug, withCanonicalVenue } from "./venues";

const at = (venue: MalmoEvent["venue"]): MalmoEvent => ({
  id: "t:1", sourceId: "t", title: "Show", startsAt: "2026-11-07T19:30:00+01:00",
  category: "music", isFree: false, url: "https://example.com/1", venue,
});

describe("withCanonicalVenue", () => {
  it("files Slagthuset's rooms under Slagthuset, keeping the room and adding coordinates", () => {
    expect(withCanonicalVenue(at({ name: "Slagthusets Teater", city: "Malmö" })).venue).toEqual({
      name: "Slagthuset", address: "Teatern", city: "Malmö", lat: 55.6094, lng: 13.0052,
    });
    expect(withCanonicalVenue(at({ name: "  slagthuset - SALUHALLEN ", address: "Jörgen Kocksgatan 7A" })).venue)
      .toMatchObject({ name: "Slagthuset", address: "Saluhallen, Jörgen Kocksgatan 7A" });
  });

  it("uses the venue's own name for other names the listings use", () => {
    expect(withCanonicalVenue(at({ name: "Malmö Live" })).venue?.name).toBe("Malmö Live Konserthus");
    expect(withCanonicalVenue(at({ name: "Biograf Panora" })).venue?.name).toBe("Panora");
    expect(withCanonicalVenue(at({ name: "Hipp (Malmö stadsteater)" })).venue?.name).toBe("Hippodromen, Malmö Stadsteater");
  });

  it("keeps coordinates the upstream gave", () => {
    const venue = { name: "Slagthusets Teater", lat: 55.61, lng: 13.01 };
    expect(withCanonicalVenue(at(venue)).venue).toMatchObject({ lat: 55.61, lng: 13.01 });
  });

  it("leaves venues that only share a building or a street alone", () => {
    for (const name of ["Malmö Opera", "Intiman, Malmö Stadsteater", "Folkets Park", "Clarion Hotel Malmö Live", "Babel"]) {
      const event = at({ name });
      expect(withCanonicalVenue(event)).toBe(event);
    }
    const none = at(undefined);
    expect(withCanonicalVenue(none)).toBe(none);
  });
});

describe("venue alias links", () => {
  it("redirects old venue pages to the venue's page, one hop, never to itself", () => {
    const redirects = venueAliasRedirects();
    expect(redirects).toContainEqual({ source: "/venues/slagthusets-teater", destination: "/venues/slagthuset", permanent: true });
    expect(redirects).toContainEqual({ source: "/venues/malmo-live", destination: "/venues/malmo-live-konserthus", permanent: true });
    const sources = new Set(redirects.map((r) => r.source));
    for (const r of redirects) {
      expect(r.source).not.toBe(r.destination);
      expect(sources.has(r.destination)).toBe(false);
    }
  });

  it("lists a venue's other names for search", () => {
    expect(venueAliasNames("Slagthuset")).toEqual(expect.arrayContaining(["Slagthusets Teater", "Slagthuset - Saluhallen"]));
    expect(venueAliasNames("Babel")).toEqual([]);
  });

  it("keeps the slug rules venue pages already use", () => {
    expect(venueSlug("Malmö Opera")).toBe("malmo-opera");
    expect(venueSlug("Hippodromen, Malmö Stadsteater")).toBe("hippodromen-malmo-stadsteater");
  });
});
