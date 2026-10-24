import { describe, expect, it } from "vitest";

import { hypnosRowToEvent, parseHypnosPage } from "./hypnos";

/** One row as the home page renders it (description shortened). */
const html = `
<div class="screening-row cat-3">
  <div class="screening-top-line"><span class="screening-film-title">DAUGHTERS OF DARKNESS</span><span class="screening-date">Fri Oct 30</span><span class="screening-time">19:30</span></div>
  <div class="screening-poster"><img src="https://hypnostheatre.com/wp-content/uploads/2026/10/image-w1280-2.webp" alt=""></div>
  <div class="screening-body"><div class="screening-actions-row">
    <div class="screening-tags"><a class="tag tag-neutral" href="https://bio.se/biografer/hypnos">100-120 SEK ↗ Bio.se</a><a class="tag tag-accent" href="https://www.cinevillebio.se/">Cineville</a></div>
    <div class="screening-buttons">
      <button type="button" class="screening-button details-toggle" data-target="screening-details-881">More Details</button>
      <div class="calendar-dropdown" id="calendar-menu-881" hidden>
        <a href="https://www.google.com/calendar/render?action=TEMPLATE&#038;text=DAUGHTERS%20OF%20DARKNESS&#038;dates=20261030T183000Z%2F20261030T200600Z&#038;location=Hypnos%20Theatre">Google Calendar</a>
        <a href="https://hypnostheatre.com/?fmm_ics=881">Apple / Outlook (.ics)</a>
      </div>
    </div>
  </div></div>
  <div class="screening-details" id="screening-details-881" hidden>
    <p class="screening-meta">Harry Kümel, 1971 &middot; 96&#039;</p>
    <div class="screening-description"><p>Newlyweds Stefan and Valerie check into a seaside hotel.</p></div>
  </div>
</div>
<div class="screening-row"><span class="screening-film-title">No calendar link</span></div>`;

describe("parseHypnosPage", () => {
  it("reads rows with a calendar link and skips the rest", () => {
    expect(parseHypnosPage(html)).toEqual([
      {
        id: "881",
        title: "DAUGHTERS OF DARKNESS",
        start: "2026-10-30T18:30:00.000Z",
        end: "2026-10-30T20:06:00.000Z",
        description: "Newlyweds Stefan and Valerie check into a seaside hotel.",
        meta: ["Harry Kümel, 1971 · 96'"],
        imageUrl: "https://hypnostheatre.com/wp-content/uploads/2026/10/image-w1280-2.webp",
        priceText: "100-120 SEK ↗ Bio.se",
        ticketUrl: "https://bio.se/biografer/hypnos",
      },
    ]);
  });
});

describe("hypnosRowToEvent", () => {
  it("maps a screening with price range and ticket link", () => {
    const [row] = parseHypnosPage(html);
    expect(hypnosRowToEvent(row)).toMatchObject({
      id: "hypnos:881",
      startsAt: "2026-10-30T18:30:00.000Z",
      endsAt: "2026-10-30T20:06:00.000Z",
      category: "film",
      price: { min: 100, max: 120, currency: "SEK" },
      isFree: false,
      venue: { name: "Hypnos Theatre", lat: 55.5856, lng: 13.0261 },
      ticketUrl: "https://bio.se/biografer/hypnos",
    });
  });

  it("keeps film titles that trip the keyword guess under film", () => {
    const [row] = parseHypnosPage(html);
    for (const title of ["A GIRL WALKS HOME ALONE AT NIGHT", "LITTLE CHILDREN", "TRIPLE HALLOWEEN"]) {
      expect(hypnosRowToEvent({ ...row, title }).category).toBe("film");
    }
    expect(hypnosRowToEvent({ ...row, title: "Konsert: Hypnos Ensemble" }).category).toBe("music");
  });
});
