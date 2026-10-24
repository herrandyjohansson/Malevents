import { describe, expect, it, vi } from "vitest";

import type { TribeEvent } from "./events-calendar";

// Demo mode, so fetchEvents maps the given events instead of calling the API. Set before the import reads it.
vi.stubEnv("EVENTS_LIVE", "false");
const { eventsCalendarSource } = await import("./events-calendar");

/** Trimmed from Medley's API, whose WordPress time zone is "UTC+0". */
const medleyRow: TribeEvent = {
  id: 13700,
  title: "Will Hoge Band (US)",
  excerpt: "",
  description: "<p>Americana from <strong>Nashville</strong>.</p>",
  url: "https://medleymalmo.se/event/will-hoge-band-us/",
  start_date: "2026-10-26 20:00:00",
  end_date: "2026-10-26 23:00:00",
  utc_start_date: "2026-10-26 20:00:00",
  utc_end_date: "2026-10-26 23:00:00",
};

function source(localTimes: boolean) {
  return eventsCalendarSource({
    id: "test",
    name: "Test",
    site: "https://example.com",
    homepage: "https://example.com",
    description: "",
    venue: { name: "Test", lat: 55.6, lng: 13 },
    fallback: "music",
    localTimes,
    demo: () => [medleyRow],
  });
}

describe("eventsCalendarSource", () => {
  it("reads start_date as Malmö time when the site's UTC dates are really local", async () => {
    const [event] = await source(true).fetchEvents({ warn: () => {} });
    expect(event.startsAt).toBe("2026-10-26T20:00:00+01:00");
    expect(event.endsAt).toBe("2026-10-26T23:00:00+01:00");
  });

  it("uses the UTC dates by default", async () => {
    const [event] = await source(false).fetchEvents({ warn: () => {} });
    expect(event.startsAt).toBe("2026-10-26T20:00:00.000Z");
  });

  it("falls back to the full description when the excerpt is empty", async () => {
    const [event] = await source(false).fetchEvents({ warn: () => {} });
    expect(event.description).toBe("Americana from Nashville.");
  });
});
