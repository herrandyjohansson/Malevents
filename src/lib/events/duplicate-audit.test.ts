import { describe, expect, it } from "vitest";

import { auditDuplicates } from "./duplicate-audit";
import type { MalmoEvent } from "./types";

const event: MalmoEvent = {
  id: "venue:1", sourceId: "venue", title: "Elvis, Elvis, Elvis! – 2026",
  startsAt: "2026-10-30T18:30:00Z", category: "music", isFree: false,
  url: "https://example.com/1",
  venue: { name: "Slagthuset", lat: 55.6094, lng: 13.0052 },
};
const other = (patch: Partial<MalmoEvent> = {}): MalmoEvent => ({
  ...event, id: "tickets:1", sourceId: "tickets", ...patch,
});

describe("duplicate diagnostics (no automatic merges)", () => {
  it("finds exact repeated IDs and title/minute collisions independently", () => {
    const result = auditDuplicates([event, event, other()]);
    expect(result.exactIds).toEqual([["venue:1", "venue:1"]]);
    expect(result.titleMinute).toHaveLength(1);
  });

  it("finds title variants across sources and venue aliases at the same coordinates", () => {
    const result = auditDuplicates([event, other({
      title: "Elvis Elvis Elvis 2026",
      venue: { ...event.venue!, name: "Slagthusets Teater" },
      startsAt: "2026-10-30T19:30:00Z",
    })]);
    expect(result.pairs).toMatchObject([{ reason: "same-title", minutesApart: 60, crossSource: true }]);
    expect(result.candidateEventIds).toHaveLength(2);
    expect(result.venuePairs).toMatchObject([{ a: "Slagthuset", b: "Slagthusets Teater", metresApart: 0 }]);
  });

  it("finds likely marketing suffix variants but not unrelated shows", () => {
    expect(auditDuplicates([
      { ...event, title: "The Jazz Room" }, other({ title: "The Jazz Room by Fever" }),
    ]).pairs).toHaveLength(1);
    expect(auditDuplicates([event, other({ title: "Jazz with friends" })]).pairs).toEqual([]);
  });

  it("keeps different days, distant venues and performances more than two hours apart separate", () => {
    for (const patch of [
      { startsAt: "2026-10-31T18:30:00Z" },
      { startsAt: "2026-10-30T21:30:00Z" },
      { venue: { name: "Different venue", lat: 55.58, lng: 13.02 } },
    ]) expect(auditDuplicates([event, other(patch)]).pairs).toEqual([]);
  });

  it("uses Stockholm days across UTC midnight and folds accents", () => {
    const result = auditDuplicates([
      { ...event, title: "Malmö kör", startsAt: "2026-10-30T23:30:00Z" },
      other({ title: "Malmo kor", startsAt: "2026-10-31T00:30:00Z" }),
    ]);
    expect(result.pairs).toMatchObject([{ minutesApart: 60, reason: "same-title" }]);
  });

  it("does not equate unknown venues or locations without coordinates", () => {
    expect(auditDuplicates([{ ...event, venue: undefined }, other({ venue: undefined })]).pairs).toEqual([]);
    expect(auditDuplicates([
      { ...event, venue: { name: "A" } }, other({ venue: { name: "B" } }),
    ]).venuePairs).toEqual([]);
  });

  it("flags Slagthuset name variants even when one source has no coordinates", () => {
    const result = auditDuplicates([
      event, other({ venue: { name: "Slagthusets Teater" } }),
    ]);
    expect(result.pairs).toHaveLength(1);
    expect(result.venuePairs).toMatchObject([{
      a: "Slagthuset", b: "Slagthusets Teater", reason: "name-prefix", metresApart: null,
    }]);
  });

  it("finds shared Tickster identities despite unrelated marketing titles and locale URLs", () => {
    const result = auditDuplicates([
      { ...event, ticketUrl: "https://secure.tickster.com/zxbzzfgjayc214v" },
      other({
        title: "Completely different marketing name", url: "https://tickets.example.com/other",
        ticketUrl: "https://secure.tickster.com/sv/zxbzzfgjayc214v",
      }),
    ]);
    expect(result.sharedLinkPairs).toMatchObject([{ identity: "tickster:zxbzzfgjayc214v", minutesApart: 0 }]);
    expect(result.pairs).toEqual([]);
  });

  it("normalizes event URLs, but keeps identifying query parameters and different dates separate", () => {
    expect(auditDuplicates([
      event, other({ url: "https://www.example.com/1/?utm_source=listing" }),
    ]).sharedLinkPairs).toHaveLength(1);
    expect(auditDuplicates([
      { ...event, url: "https://example.com/event?id=1" },
      other({ url: "https://example.com/event?id=2" }),
    ]).sharedLinkPairs).toEqual([]);
    expect(auditDuplicates([
      event, other({ startsAt: "2026-10-31T18:30:00Z" }),
    ]).sharedLinkPairs).toEqual([]);
  });

  it("counts three linked listings as one occurrence group, not three duplicate events", () => {
    const result = auditDuplicates([
      event, other(), { ...event, id: "city:1", sourceId: "city" },
    ]);
    expect(result.sharedLinkPairs).toHaveLength(3);
    expect(result.identityGroups).toHaveLength(1);
    expect(result.identitySupportedSurplus).toBe(2);
  });
});
