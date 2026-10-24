import { describe, expect, it } from "vitest";

import { panoraSessionToEvent, type BioFilm } from "./panora";

/** Trimmed from a real bio.se response. */
const film: BioFilm = {
  movie: {
    id: 42478,
    title: "Fjord",
    synopsis: "Vinnare av Guldpalmen i Cannes 2026&lt;br&gt;&lt;br&gt;Det rumänsk-norska paret flyttar till Norge.",
    genre: "Drama,Thriller",
    poster_url: "https://wp3-prod-bucket.s3.eu-central-1.amazonaws.com/app/uploads/2026/10/fjord-poster.jpg",
    run_time: "146",
    rating: "Från 11 år",
  },
  sessions: [
    {
      id: "0000000479-1094",
      show_date_time: "2026-10-24T19:30:00",
      payment_link: "/bokning/cinemaId/2128/sessionId/1094",
      screen_name: "Salong 3",
      text: "Svenska",
    },
  ],
};

describe("panoraSessionToEvent", () => {
  it("maps a session with screen, subtitles, ticket link and end time", () => {
    expect(panoraSessionToEvent(film, film.sessions[0])).toMatchObject({
      id: "panora:0000000479-1094",
      title: "Fjord",
      description: "Vinnare av Guldpalmen i Cannes 2026 Det rumänsk-norska paret flyttar till Norge.",
      startsAt: "2026-10-24T19:30:00+02:00",
      endsAt: "2026-10-24T19:56:00.000Z",
      category: "film",
      venue: { name: "Panora", address: "Salong 3, Friisgatan 19D" },
      ticketUrl: "https://bio.se/bokning/cinemaId/2128/sessionId/1094",
      notes: ["Salong 3", "Från 11 år", "Text: Svenska"],
    });
  });

  it("files children's films under family and leaves out an unknown running time and rating", () => {
    const kids: BioFilm = { ...film, movie: { ...film.movie, genre: "Barnfilm,Animerad film", run_time: "0", rating: "Ej angivet" } };
    const event = panoraSessionToEvent(kids, film.sessions[0]);
    expect(event?.category).toBe("family");
    expect(event?.endsAt).toBeUndefined();
    expect(event?.notes).toEqual(["Salong 3", "Text: Svenska"]);
  });

  it("skips sessions without a date", () => {
    expect(panoraSessionToEvent(film, { ...film.sessions[0], show_date_time: "" })).toBeUndefined();
  });
});
