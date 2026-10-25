import { describe, expect, it } from "vitest";

import { isSameSaved } from "./saved-snapshot";

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
