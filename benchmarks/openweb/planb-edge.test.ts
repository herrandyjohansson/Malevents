import { describe, expect, it } from "vitest";

import { planBEdgeToEvent, type PlanBEdgeEvent } from "./planb-edge";

/** Trimmed from a real `/api/eventsEdge` row. */
const edge = (overrides: Partial<PlanBEdgeEvent> = {}, fields: PlanBEdgeEvent["custom_fields"] = {}): PlanBEdgeEvent => ({
  id: "FQeHZiGtB8",
  name: "Rekordåren ",
  start_time: "2026-10-24T16:00:00.000Z",
  tags: ["DNBK", "Indie"],
  details: "\n\n**CONCERT: DNBK pres. Rekordåren**\n\nRekordåren är en liveakt.",
  photo: { urls: { large: "https://ik.imagekit.io/mfgbmrqfuvo/venues/event_0oZpIqH8N/tr:w-750" } },
  place: { name: "Plan B - Malmö " },
  custom_fields: {
    show_start_time: "2026-10-24T17:00:00.000Z",
    end_time: "2026-10-24T22:00:00.000Z",
    cover: "SEK 195",
    freeEntry: false,
    soldOut: false,
    eventStatus: "ONSALE",
    type: "Concert",
    ticketUrl: "https://www.nortic.se/ticket/show/349018",
    secondaryTitle: "Support: what the tusan",
    published: true,
    ...fields,
  },
  ...overrides,
});

describe("planBEdgeToEvent", () => {
  it("maps a Plan B show with the show time as start and doors in the notes", () => {
    const event = planBEdgeToEvent(edge());
    expect(event).toMatchObject({
      id: "plan-b:FQeHZiGtB8",
      sourceId: "plan-b",
      title: "Rekordåren",
      startsAt: "2026-10-24T17:00:00.000Z",
      endsAt: "2026-10-24T22:00:00.000Z",
      category: "music",
      price: { min: 195, max: 195, currency: "SEK" },
      isFree: false,
      ticketUrl: "https://www.nortic.se/ticket/show/349018",
      notes: ["Insläpp 18:00"],
    });
    expect(event?.timeUnknown).toBeUndefined();
    expect(event?.description).toMatch(/^Support: what the tusan\. CONCERT: DNBK pres\. Rekordåren/);
  });

  it("links to /events/<slug>/<id>, the page format the site serves", () => {
    expect(planBEdgeToEvent(edge())?.url).toBe("https://www.planbmalmo.com/events/rekordaaren/FQeHZiGtB8");
  });

  it("falls back to the door time when there is no show time", () => {
    for (const show_start_time of [undefined, ""]) {
      const event = planBEdgeToEvent(edge({}, { show_start_time }));
      expect(event?.startsAt).toBe("2026-10-24T16:00:00.000Z");
      expect(event?.notes).toBeUndefined();
    }
  });

  it("leaves out Plan B's shows at other venues", () => {
    expect(planBEdgeToEvent(edge({ place: { name: "Moriska Paviljongen" } }))).toBeUndefined();
  });

  it("leaves out unpublished and cancelled events", () => {
    expect(planBEdgeToEvent(edge({}, { published: false }))).toBeUndefined();
    expect(planBEdgeToEvent(edge({}, { eventStatus: "CANCELLED" }))).toBeUndefined();
  });

  it("marks sold-out and free events", () => {
    expect(planBEdgeToEvent(edge({}, { eventStatus: "SOLDOUT" }))?.soldOut).toBe(true);
    const free = planBEdgeToEvent(edge({}, { freeEntry: true, cover: "" }));
    expect(free?.isFree).toBe(true);
    expect(free?.price).toBeUndefined();
  });
});
