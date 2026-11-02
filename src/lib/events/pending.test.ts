import { describe, expect, it } from "vitest";

import { listedSources, pendingNames } from "./pending";
import type { SourceStatus } from "./types";

const base = { name: "Venue", demo: false, enabled: true, state: "ok", count: 3 } satisfies Omit<SourceStatus, "id">;

describe("listedSources", () => {
  it("offers visitors only sources with events right now", () => {
    const sources: SourceStatus[] = [
      { ...base, id: "ok" },
      { ...base, id: "down", state: "error", count: 0, error: "fetch failed" },
      { ...base, id: "slow", state: "pending", count: 0 },
      { ...base, id: "off", enabled: false, state: "disabled", count: 0 },
      { ...base, id: "empty", count: 0 },
    ];
    expect(listedSources(sources).map((s) => s.id)).toEqual(["ok"]);
  });
});

describe("pendingNames", () => {
  it("names the sources still loading", () => {
    expect(pendingNames([{ name: "A", state: "pending" }, { name: "B", state: "ok" }])).toEqual(["A"]);
  });
});
