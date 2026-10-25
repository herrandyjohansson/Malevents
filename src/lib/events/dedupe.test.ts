import { describe, expect, it } from "vitest";

import { eventIdentities, mergeDuplicates } from "./dedupe";
import type { MalmoEvent } from "./types";

const SLAGTHUSET = { name: "Slagthuset", address: "Jörgen Kocksgatan 7A", lat: 55.6094, lng: 13.0052 };
/** Venue sources rank first; aggregators (city calendar, Tickster) after them. */
const RANK: Record<string, number> = { slagthuset: 0, spegeln: 1, "malmo-stad": 100, "tickster-malmo": 101 };
const rank = (sourceId: string) => RANK[sourceId] ?? 50;

const venue = (patch: Partial<MalmoEvent> = {}): MalmoEvent => ({
  id: "slagthuset:6894",
  sourceId: "slagthuset",
  title: "Elvis, Elvis, Elvis!",
  startsAt: "2026-10-30T19:30:00+01:00",
  category: "music",
  isFree: false,
  venue: SLAGTHUSET,
  url: "https://slagthuset.se/events/elvis-elvis-elvis-2026/",
  ticketUrl: "https://secure.tickster.com/nan25y64l2c34wj",
  ...patch,
});
const tickster = (patch: Partial<MalmoEvent> = {}): MalmoEvent => ({
  id: "tickster-malmo:nan25y64l2c34wj@2026-10-30",
  sourceId: "tickster-malmo",
  title: "Elvis, Elvis, Elvis! - 2026",
  startsAt: "2026-10-30T19:30:00+01:00",
  category: "music",
  isFree: false,
  venue: { name: "Slagthuset" },
  url: "https://www.tickster.com/se/sv/events/nan25y64l2c34wj/2026-10-30/elvis-elvis-elvis-2026",
  ticketUrl: "https://secure.tickster.com/sv/nan25y64l2c34wj",
  price: { min: 495, max: 495, currency: "SEK" },
  imageUrl: "https://example.com/elvis.jpg",
  ...patch,
});
const city = (patch: Partial<MalmoEvent> = {}): MalmoEvent => ({
  id: "malmo-stad:5.50574bcf196ed960a5525694@1793388600000",
  sourceId: "malmo-stad",
  title: "Elvis, Elvis, Elvis!",
  description: "En hyllning till kungen.",
  startsAt: "2026-10-30T19:30:00+01:00",
  category: "music",
  isFree: false,
  venue: { name: "Slagthuset", city: "Malmö" },
  url: "https://www.slagthuset.se/events/elvis-elvis-elvis-2026",
  ...patch,
});
const merge = (events: MalmoEvent[]) => mergeDuplicates(events, rank);

describe("eventIdentities", () => {
  it("gives every Tickster link form the same booking identity", () => {
    expect(eventIdentities(tickster())).toEqual(["tickster:nan25y64l2c34wj"]);
    expect(eventIdentities(venue())).toContain("tickster:nan25y64l2c34wj");
  });

  it("canonicalises event pages but ignores home pages and tracking parameters", () => {
    expect(eventIdentities(city())).toEqual(["slagthuset.se/events/elvis-elvis-elvis-2026"]);
    expect(eventIdentities({ url: "https://www.slagthuset.se/?utm_source=x" })).toEqual([]);
    expect(eventIdentities({ url: "https://example.com/e?id=2&utm_medium=mail" })).toEqual(["example.com/e?id=2"]);
    expect(eventIdentities({ url: "not a url" })).toEqual([]);
  });
});

describe("mergeDuplicates", () => {
  it("merges the venue, Tickster and city listings of one show into the venue's record", () => {
    const [merged, ...rest] = merge([city(), tickster(), venue()]);
    expect(rest).toEqual([]);
    expect(merged.id).toBe("slagthuset:6894");
    expect(merged.title).toBe("Elvis, Elvis, Elvis!");
    expect(merged.duplicateIds).toEqual([city().id, tickster().id].sort());
    // Gaps are filled from the other listings, the venue's own facts are kept.
    expect(merged).toMatchObject({
      description: "En hyllning till kungen.",
      imageUrl: "https://example.com/elvis.jpg",
      price: { min: 495 },
      venue: SLAGTHUSET,
      url: venue().url,
      ticketUrl: venue().ticketUrl,
    });
  });

  it("merges a shared booking id despite different marketing titles", () => {
    const result = merge([venue({ title: "Rollspelsklubben SKRÄCK!" }), tickster({ title: "Skräck!" })]);
    expect(result).toHaveLength(1);
  });

  it("tolerates a few minutes between listings of one booking, not an hour", () => {
    expect(merge([venue(), tickster({ startsAt: "2026-10-30T19:35:00+01:00" })])).toHaveLength(1);
    expect(merge([venue(), tickster({ startsAt: "2026-10-30T20:30:00+01:00" })])).toHaveLength(2);
  });

  it("keeps a matinee and an evening show sharing one booking page apart", () => {
    const matinee = venue({ id: "slagthuset:matinee", startsAt: "2026-10-30T14:00:00+01:00" });
    const result = merge([matinee, venue(), tickster()]);
    expect(result.map((e) => e.id)).toEqual(["slagthuset:matinee", "slagthuset:6894"]);
    expect(result[1].duplicateIds).toEqual([tickster().id]);
  });

  it("never merges two different times from the same source, even through a third listing", () => {
    const early = venue({ id: "slagthuset:a", startsAt: "2026-10-30T19:30:00+01:00" });
    const late = venue({ id: "slagthuset:b", startsAt: "2026-10-30T19:40:00+01:00" });
    const result = merge([early, late, tickster({ startsAt: "2026-10-30T19:35:00+01:00" })]);
    expect(result).toHaveLength(2);
    expect(result.flatMap((e) => [e.id, ...(e.duplicateIds ?? [])]).sort()).toEqual(
      ["slagthuset:a", "slagthuset:b", tickster().id].sort(),
    );
  });

  it("does not chain listings into a group spanning more than the tolerance", () => {
    const a = venue({ startsAt: "2026-10-30T19:00:00+01:00", url: "https://slagthuset.se/a" });
    const b = tickster({ startsAt: "2026-10-30T19:10:00+01:00", url: "https://shared.example/b" });
    const c = city({ startsAt: "2026-10-30T19:20:00+01:00", url: "https://shared.example/b", title: "Other" });
    const result = merge([a, b, c]);
    expect(result).toHaveLength(2);
    expect(result.every((e) => (e.duplicateIds?.length ?? 0) <= 1)).toBe(true);
  });

  it("keeps separate screenings of one film in one cinema", () => {
    const film = (id: string, startsAt: string): MalmoEvent => ({
      ...venue(), id, sourceId: "spegeln", title: "Resan till Piemonte", startsAt,
      venue: { name: "Biograf Spegeln", lat: 55.6054, lng: 13.0007 }, url: "https://spegeln.example/film/1",
      ticketUrl: undefined,
    });
    expect(merge([film("spegeln:1", "2026-10-25T16:30:00+02:00"), film("spegeln:2", "2026-10-25T18:00:00+02:00")]))
      .toHaveLength(2);
  });

  it("merges the same title at the same minute, unless the venues are far apart", () => {
    const plain = { url: "https://a.example/x", ticketUrl: undefined };
    expect(merge([venue(plain), city({ url: "https://b.example/y" })])).toHaveLength(1);
    const elsewhere = city({ url: "https://b.example/y", venue: { name: "Malmö Arena", lat: 55.5653, lng: 12.9752 } });
    expect(merge([venue(plain), elsewhere])).toHaveLength(2);
  });

  it("collapses a listing the same feed repeats, keeping the richer copy", () => {
    const thin = city({ description: undefined });
    const result = merge([thin, city()]);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("En hyllning till kungen.");
  });

  it("does not copy another listing's sold-out or cancelled status", () => {
    const [merged] = merge([venue(), tickster({ soldOut: true, cancelled: true })]);
    expect(merged.soldOut).toBeUndefined();
    expect(merged.cancelled).toBeUndefined();
  });

  it("gives the same result whatever order the sources answered in", () => {
    const input = [
      venue(), tickster(), city(),
      venue({ id: "slagthuset:matinee", startsAt: "2026-10-30T14:00:00+01:00" }),
      city({ id: "malmo-stad:other", title: "Macy Gray", url: "https://slagthuset.se/events/macy-gray" }),
    ];
    const expected = merge(input);
    for (const order of [[...input].reverse(), [input[2], input[4], input[0], input[3], input[1]]]) {
      expect(merge(order)).toEqual(expected);
    }
  });

  it("sorts by start instant even when sources write different offsets", () => {
    const result = merge([
      city({ id: "malmo-stad:late", title: "Late", startsAt: "2026-10-30T19:00:00.000Z", url: "https://x.example/1" }),
      venue({ id: "slagthuset:early", title: "Early", startsAt: "2026-10-30T19:30:00+01:00", ticketUrl: undefined }),
    ]);
    expect(result.map((e) => e.title)).toEqual(["Early", "Late"]);
  });
});
