import { describe, expect, it, vi } from "vitest";

// Demo mode, so fetchEvents runs on the fixture instead of the network. Set before the import reads it.
vi.stubEnv("EVENTS_LIVE", "false");
const { medley } = await import("./medley");

describe("medley", () => {
  it("leaves out evenings booked for private parties", async () => {
    const events = await medley.fetchEvents({ warn: () => {} });
    expect(events.map((e) => e.title)).toEqual(["Will Hoge Band (US)", "Mick Harvey (AUS)"]);
    expect(events[0]).toMatchObject({ id: "medley:1", category: "music", venue: { name: "Medley", address: "Södra Promenaden 51" } });
  });
});
