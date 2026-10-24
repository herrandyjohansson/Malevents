import { describe, expect, it } from "vitest";

import { arenaRowToEvent, parseArenaListing } from "./malmo-arena";

/** Two items as the HubSpot listing renders them. */
const html = `
<div class="event-listing__item">
  <div class="event-listing__first-block">
    <div class="event-listing__img-frame"><img src="https://143366277.fs1.hubspotusercontent-eu1.net/hub/143366277/hubfs/BritFloyd.jpg?width=768|" alt="Brit Floyd"></div>
    <div class="event-listing__card-block"><span>8 oktober -</span><a href="/evenemang?ecategories=2&amp;hsLang=sv">Musik &amp; Show</a></div>
    <h2 class="h5">Brit Floyd</h2>
  </div>
  <div class="event-listing__second-block"><a href="/evenemang?ecategories=2&amp;hsLang=sv" title="Musik &amp; Show">Musik &amp; Show</a></div>
  <div class="event-listing__third-block"> 8 okt. | Kl 19:00 </div>
  <div class="event-listing__buttons">
    <a href="/evenemang/brit-floyd?hsLang=sv" title="Info">Info</a>
    <a href="https://www.ticketmaster.se/event/1255113262" title="Köp biljett">Köp biljett</a>
  </div>
</div>
<div class="event-listing__item">
  <div class="event-listing__first-block"><h2 class="h5">Malmö Redhawks - Björklöven</h2></div>
  <div class="event-listing__second-block"><a href="/evenemang?ecategories=1" title="Redhawks">Redhawks</a></div>
  <div class="event-listing__third-block"> 16 mars | Kl 19:00 </div>
  <div class="event-listing__buttons"><a href="/evenemang/malmo-redhawks-bjorkloven?hsLang=sv" title="Info">Info</a></div>
</div>`;

describe("parseArenaListing", () => {
  it("reads each listing item", () => {
    expect(parseArenaListing(html)).toEqual([
      {
        slug: "brit-floyd",
        title: "Brit Floyd",
        type: "Musik & Show",
        when: "8 okt. | Kl 19:00",
        imageUrl: "https://143366277.fs1.hubspotusercontent-eu1.net/hub/143366277/hubfs/BritFloyd.jpg?width=768",
        ticketUrl: "https://www.ticketmaster.se/event/1255113262",
      },
      { slug: "malmo-redhawks-bjorkloven", title: "Malmö Redhawks - Björklöven", type: "Redhawks", when: "16 mars | Kl 19:00", imageUrl: undefined, ticketUrl: undefined },
    ]);
  });
});

describe("arenaRowToEvent", () => {
  const [show, game] = parseArenaListing(html);

  it("puts a date that has passed this year in next year", () => {
    expect(arenaRowToEvent(show, "2026-10-24")).toMatchObject({
      id: "malmo-arena:brit-floyd@2027-10-08",
      startsAt: "2027-10-08T19:00:00+02:00",
      category: "music",
      url: "https://www.malmoarena.com/evenemang/brit-floyd",
      venue: { name: "Malmö Arena" },
    });
  });

  it("keeps shows out of categories their titles trip", () => {
    const category = (title: string) => arenaRowToEvent({ ...show, title }, "2026-10-24")?.category;
    expect(category("Disney on Ice - Discover the Magic")).toBe("family");
    expect(category("Melodifestivalen 2027 - Matiné")).toBe("music");
    expect(category("Night of Famous Musicals")).toBe("theatre");
  });

  it("files Redhawks home games under sports", () => {
    expect(arenaRowToEvent(game, "2026-10-24")).toMatchObject({ startsAt: "2027-03-16T19:00:00+01:00", category: "sports" });
  });
});
