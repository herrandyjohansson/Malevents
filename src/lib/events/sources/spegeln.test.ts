import { describe, expect, it } from "vitest";

import { parseSpegelnProgram, spegelnScreeningToEvent, type SpegelnFeature } from "./spegeln";

const feature: SpegelnFeature = {
  id: 1354,
  url: "https://biografspegeln.se/program/sing-along-hair",
  info: {
    title: "Sing Along: Hair",
    synopsis: "<p><strong>Sjung med i <em>Hair</em>!</strong></p>",
    genres: [{ name: "Musikal" }],
    ageLimit: "Barntillåten",
    duration: 121,
    image: {
      imageUrl: "http://localhost:8080/media/abc/hair.jpg",
      crops: [{ alias: "card", url: "http://localhost:8080/media/abc/hair.jpg?width=960&height=540" }],
    },
  },
};

describe("parseSpegelnProgram", () => {
  it("reads the programme from the Next.js data", () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: { pageProps: { programList: { features: [feature], schedule: [{ featureId: 1354, dates: [] }] } } },
    })}</script>`;
    expect(parseSpegelnProgram(html).features[0].id).toBe(1354);
  });

  it("fails loudly when the page data is gone", () => {
    expect(() => parseSpegelnProgram("<html></html>")).toThrow(/Next.js data/);
  });
});

describe("spegelnScreeningToEvent", () => {
  it("maps a screening in Malmö time, with the screen and the end from the running time", () => {
    const event = spegelnScreeningToEvent(feature, {
      startDate: "2027-01-29T20:45:00.000",
      ticksterLink: "https://secure.tickster.com/ccpj820pxu4jxdk",
      soldOut: false,
      saloonLabel: "Alcazar",
    });
    expect(event).toMatchObject({
      id: "spegeln:1354@2027-01-29T20:45",
      title: "Sing Along: Hair",
      description: "Sjung med i Hair!",
      startsAt: "2027-01-29T20:45:00+01:00",
      endsAt: "2027-01-29T21:46:00.000Z",
      category: "film",
      venue: { name: "Biograf Spegeln", address: "Alcazar, Stortorget 29" },
      ticketUrl: "https://secure.tickster.com/ccpj820pxu4jxdk",
      notes: ["Alcazar", "Barntillåten"],
    });
    expect(event?.soldOut).toBeUndefined();
  });

  it("serves the CMS's localhost image URLs from the site", () => {
    const event = spegelnScreeningToEvent(feature, { startDate: "2026-11-01T18:00:00.000" });
    expect(event?.imageUrl).toBe("https://biografspegeln.se/media/abc/hair.jpg?width=960&height=540");
  });

  it("files children's films under family", () => {
    const kids = { ...feature, info: { ...feature.info, genres: [{ name: "Barnfilm" }] } };
    expect(spegelnScreeningToEvent(kids, { startDate: "2026-11-01T13:00:00.000" })?.category).toBe("family");
  });

  it("skips screenings without a usable date", () => {
    expect(spegelnScreeningToEvent(feature, { startDate: "" })).toBeUndefined();
  });
});
