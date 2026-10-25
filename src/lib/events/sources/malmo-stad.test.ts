import { describe, expect, it } from "vitest";

import { localDay, localTime } from "../malmo-time";
import { malmoStadItemToEvent, type MalmoStadItem } from "./malmo-stad";

/** Real values from malmo.se/evenemang (24 Oct 2026): the epochs carry Malmö wall-clock time as if it were UTC. */
const utc = (iso: string) => Date.parse(`${iso}Z`);
const item = (dates: MalmoStadItem["dates"], patch: Partial<MalmoStadItem> = {}): MalmoStadItem => ({
  id: "5.e99dd2f1a08fc27cf97cf7",
  title: "Macy Gray",
  url: "https://slagthuset.se/events/macy-gray",
  place: ["Slagthuset"],
  dates,
  ...patch,
});
const convert = (value: MalmoStadItem) => {
  const event = malmoStadItemToEvent(value);
  if (!event) throw new Error("Item was dropped");
  return event;
};

describe("malmoStadItemToEvent times", () => {
  it("shows the calendar's displayed clock time in winter (CET)", () => {
    const event = convert(item({ time: "19:30", sortDateTime: utc("2026-11-19T19:30"), isSingleDay: true }));
    expect(event.startsAt).toBe("2026-11-19T19:30:00+01:00");
    expect(localTime(new Date(event.startsAt))).toBe("19:30");
  });

  it("shows the displayed clock time in summer time (CEST)", () => {
    const event = convert(item({ time: "21:00", sortDateTime: utc("2026-10-24T21:00"), isSingleDay: true }));
    expect(event.startsAt).toBe("2026-10-24T21:00:00+02:00");
    expect(localTime(new Date(event.startsAt))).toBe("21:00");
  });

  it("uses the right offset on both daylight-saving change days", () => {
    const autumn = convert(item({ time: "15:00", sortDateTime: utc("2026-10-25T15:00"), isSingleDay: true }));
    const spring = convert(item({ time: "19:00", sortDateTime: utc("2027-03-28T19:00"), isSingleDay: true }));
    expect(autumn.startsAt).toBe("2026-10-25T15:00:00+01:00");
    expect(spring.startsAt).toBe("2027-03-28T19:00:00+02:00");
  });

  it("converts the end of a time range the same way", () => {
    const event = convert(item({
      time: "16:30 – 17:30", sortDateTime: utc("2026-11-02T16:30"), endSortDateTime: utc("2026-11-02T17:30"), isSingleDay: true,
    }));
    expect(localTime(new Date(event.startsAt))).toBe("16:30");
    expect(localTime(new Date(event.endsAt!))).toBe("17:30");
  });

  it("keeps a multi-day exhibition inside its Malmö days instead of spilling into the next one", () => {
    const event = convert(item({
      sortDateTime: utc("2026-10-24T00:00"), endSortDateTime: utc("2026-10-29T23:59"), isSingleDay: false,
    }));
    expect([localDay(new Date(event.startsAt)), localTime(new Date(event.startsAt))]).toEqual(["2026-10-24", "00:00"]);
    expect([localDay(new Date(event.endsAt!)), localTime(new Date(event.endsAt!))]).toEqual(["2026-10-29", "23:59"]);
    expect(event.timeUnknown).toBeUndefined();
  });

  it("marks a single day without a time as time unknown, at Malmö midnight", () => {
    const event = convert(item({ time: "", sortDateTime: utc("2026-11-05T00:00"), isSingleDay: true }));
    expect(event.timeUnknown).toBe(true);
    expect(event.startsAt).toBe("2026-11-05T00:00:00+01:00");
  });

  it("drops an end equal to the start and keeps the id built from the upstream epoch", () => {
    const start = utc("2026-11-19T19:30");
    const event = convert(item({ time: "19:30", sortDateTime: start, endSortDateTime: start, isSingleDay: true }));
    expect(event.endsAt).toBeUndefined();
    expect(event.id).toBe(`malmo-stad:5.e99dd2f1a08fc27cf97cf7@${start}`);
  });
});
