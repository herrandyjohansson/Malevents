import { describe, expect, it } from "vitest";

import { buildSearchDocuments } from "./search-data";
import { createEventSearch, searchEvents } from "./search";
import type { MalmoEvent } from "./types";

const now = new Date("2026-10-24T17:00:00Z");
const event: MalmoEvent = {
  id: "test:concert/1",
  sourceId: "test",
  title: "Jazz after dark",
  description: "An acoustic quartet",
  startsAt: "2026-11-02T19:00:00Z",
  category: "music",
  isFree: false,
  venue: { name: "Malmö Live", address: "Dag Hammarskjölds torg" },
  url: "https://example.com/concert",
};

describe("upcoming event and venue search", () => {
  it("includes events beyond the day strip and groups venues using their existing slugs", () => {
    const documents = buildSearchDocuments([
      event,
      { ...event, id: "test:future", startsAt: "2027-03-01T19:00:00Z" },
    ], now);
    expect(documents.filter((d) => d.kind === "event")).toHaveLength(2);
    expect(documents.filter((d) => d.kind === "venue")).toMatchObject([
      { title: "Malmö Live", href: "/venues/malmo-live", subtitle: expect.stringContaining("2 upcoming events") },
    ]);
    expect(documents.find((d) => d.id === `event:${event.id}`)?.href).toBe("/events/test%3Aconcert%2F1");
  });

  it("excludes ended events and their venues, but keeps ongoing events", () => {
    const documents = buildSearchDocuments([
      { ...event, id: "test:past", startsAt: "2026-10-01T17:00:00Z", venue: { name: "Past venue" } },
      { ...event, startsAt: "2026-10-24T15:00:00Z", endsAt: "2026-10-24T21:00:00Z" },
    ], now);
    expect(documents.map((d) => d.title)).toEqual(["Jazz after dark", "Malmö Live"]);
  });

  it("includes event artwork and facts, and two chronological venue previews without ended events", () => {
    const documents = buildSearchDocuments([
      { ...event, id: "test:late", startsAt: "2026-12-01T19:00:00Z" },
      { ...event, imageUrl: "https://example.com/jazz.jpg", isFree: true },
      { ...event, id: "test:next", startsAt: "2026-11-03T19:00:00Z" },
      { ...event, id: "test:ended", startsAt: "2026-10-01T19:00:00Z" },
    ], now);
    expect(documents.find((d) => d.id === `event:${event.id}`)).toMatchObject({
      imageUrl: "https://example.com/jazz.jpg",
      category: "music",
      price: "Free",
      startsAt: event.startsAt,
    });
    const venue = documents.find((d) => d.kind === "venue");
    expect(venue?.imageUrl).toBe("https://example.com/jazz.jpg");
    expect(venue?.upcoming?.map((preview) => preview.href)).toEqual([
      "/events/test%3Aconcert%2F1", "/events/test%3Anext",
    ]);
    expect(venue?.upcoming?.[0]).toMatchObject({ title: event.title, date: expect.stringContaining("2 Nov") });
  });

  it("keeps missing images and prices optional and exposes cancellation status", () => {
    const documents = buildSearchDocuments([{ ...event, cancelled: true }], now);
    expect(documents[0]).toMatchObject({ status: "Cancelled" });
    expect(documents[0].imageUrl).toBeUndefined();
    expect(documents[0].price).toBeUndefined();
  });

  const documents = () => buildSearchDocuments([event], now);
  const search = (query: string) => searchEvents(createEventSearch(documents()), query);

  it("searches titles, descriptions, and venue names with prefixes and typo tolerance", () => {
    expect(search("jaz").map((d) => d.title)).toContain(event.title);
    expect(search("quartet").map((d) => d.title)).toContain(event.title);
    expect(search("jazz aftr").map((d) => d.title)).toContain(event.title);
    expect(search("malmo live").map((d) => d.kind)).toEqual(expect.arrayContaining(["event", "venue"]));
  });

  it("finds a venue and its events by another name or room of the venue", () => {
    const docs = buildSearchDocuments([
      { ...event, venue: { name: "Slagthuset", address: "Saluhallen, Jörgen Kocksgatan 7A" } },
    ], now);
    const found = searchEvents(createEventSearch(docs), "slagthusets teater");
    expect(found.map((d) => [d.kind, d.href])).toContainEqual(["venue", "/venues/slagthuset"]);
    expect(searchEvents(createEventSearch(docs), "saluhallen").map((d) => d.kind)).toContain("event");
  });

  it("requires all query words and handles empty, punctuation-only, or unmatched queries", () => {
    expect(search("jazz football")).toEqual([]);
    for (const query of ["", "  ", "!!!", "unfindablexyz"]) expect(search(query)).toEqual([]);
  });

  it("ranks title matches above description-only matches", () => {
    const docs = buildSearchDocuments([
      { ...event, id: "test:description", title: "Quartet", description: "Jazz after dark" },
      event,
    ], now);
    expect(searchEvents(createEventSearch(docs), "jazz")[0].title).toBe(event.title);
  });
});
