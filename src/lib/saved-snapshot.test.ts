import { describe, expect, it } from "vitest";

import { isSameSaved, parseSaved } from "./saved-snapshot";

describe("isSameSaved", () => {
  const kept = { id: "slagthuset:6894", duplicateIds: ["malmo-stad:5.1@1", "tickster-malmo:x@2026-10-30"] };

  it("recognises a heart saved on a listing that was later merged into the kept event", () => {
    expect(isSameSaved({ id: "malmo-stad:5.1@1" }, kept)).toBe(true);
    expect(isSameSaved({ id: "slagthuset:6894" }, kept)).toBe(true);
  });

  it("recognises it the other way round, when another listing becomes the kept one", () => {
    expect(isSameSaved(kept, { id: "tickster-malmo:x@2026-10-30", duplicateIds: ["slagthuset:6894"] })).toBe(true);
  });

  it("keeps different events apart, including saved entries from before merging existed", () => {
    expect(isSameSaved({ id: "slagthuset:7736" }, kept)).toBe(false);
    expect(isSameSaved({ id: "a" }, { id: "b" })).toBe(false);
  });
});

describe("parseSaved", () => {
  const good = { id: "a", title: "A", url: "https://example.com", startsAt: "2026-11-02T19:00:00+01:00", category: "music", isFree: false, savedAt: "2026-11-01T10:00:00Z" };

  it("keeps valid entries", () => {
    expect(parseSaved(JSON.stringify([good]))).toEqual([good]);
  });

  it("drops entries the Saved tab can't show instead of crashing on them", () => {
    const stored = [good, { ...good, id: "no-date", startsAt: undefined }, { ...good, id: "bad-date", startsAt: "soon" }, { ...good, id: "bad-end", endsAt: "later" }, { ...good, id: "no-url", url: 42 }, null, "text"];
    expect(parseSaved(JSON.stringify(stored)).map((e) => e.id)).toEqual(["a"]);
  });

  it("starts over on an empty, corrupt or non-list value", () => {
    expect(parseSaved(null)).toEqual([]);
    expect(parseSaved("{not json")).toEqual([]);
    expect(parseSaved(JSON.stringify({ id: "a" }))).toEqual([]);
  });
});
