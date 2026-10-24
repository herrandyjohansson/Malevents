import "server-only";

import { LIVE_MODE } from "../config";
import { truncate } from "../html";
import { fetchText } from "../http";
import { parsePriceText, toCategory } from "../normalize";
import { loadHtml, textOf } from "../scrape";
import type { EventSource, MalmoEvent } from "../types";

const ID = "hypnos";
const SITE = "https://hypnostheatre.com";

const VENUE = { name: "Hypnos Theatre", address: "Norra Grängesbergsgatan 15", city: "Malmö", lat: 55.5856, lng: 13.0261 };

export interface HypnosRow {
  /** The WordPress post id, from the row's "More Details" toggle. */
  id: string;
  title: string;
  /** UTC, from the row's Google Calendar link ("20261030T183000Z"). */
  start: string;
  end?: string;
  description?: string;
  /** "Ebba Stoppelenburg, 2026 · 17'", "Death Cafe Malmö". */
  meta: string[];
  imageUrl?: string;
  /** "100-120 SEK ↗ Bio.se" */
  priceText?: string;
  ticketUrl?: string;
}

/** "20261030T183000Z" → ISO. */
function calendarTime(value: string | undefined) {
  const m = value?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z` : undefined;
}

/**
 * The home page lists every coming screening and event as a
 * `.screening-row`. The exact times are only in each row's "add to Google
 * Calendar" link (`dates=START/END` in UTC); the visible "Fri Oct 30" has no year.
 */
export function parseHypnosPage(html: string): HypnosRow[] {
  const $ = loadHtml(html);
  return $(".screening-row")
    .toArray()
    .flatMap((el) => {
      const row = $(el);
      const calendar = row.find('a[href*="calendar/render"]').first().attr("href");
      if (!calendar) return [];
      let dates: string[] = [];
      try {
        dates = (new URL(calendar).searchParams.get("dates") ?? "").split("/");
      } catch {
        return [];
      }
      const start = calendarTime(dates[0]);
      const id = row.find("[data-target^='screening-details-']").first().attr("data-target")?.replace("screening-details-", "");
      const title = textOf($, row.find(".screening-film-title").first());
      if (!start || !id || !title) return [];
      const price = row.find(".screening-tags a.tag-neutral").first();
      return [
        {
          id,
          title,
          start,
          end: calendarTime(dates[1]),
          description: textOf($, row.find(".screening-description").first()) || undefined,
          meta: row
            .find(".screening-meta")
            .toArray()
            .map((m) => textOf($, m))
            .filter(Boolean),
          imageUrl: row.find(".screening-poster img").first().attr("src") || undefined,
          priceText: textOf($, price) || undefined,
          ticketUrl: price.attr("href") || undefined,
        },
      ];
    });
}

export function hypnosRowToEvent(row: HypnosRow): MalmoEvent {
  // Film titles trip the keyword guess ("Little Children" is not a family film,
  // "…Alone at Night" not a club night), so only a few categories may override "film".
  const guess = toCategory(row.title);
  const category = guess === "talks" || guess === "music" || guess === "theatre" ? guess : "film";
  return {
    id: `${ID}:${row.id}`,
    sourceId: ID,
    title: row.title,
    description: truncate(row.description),
    startsAt: row.start,
    // The calendar end is often start + running time, which is shorter than the evening.
    endsAt: row.end && row.end > row.start ? row.end : undefined,
    category,
    venue: VENUE,
    ...parsePriceText(row.priceText?.replace(/bio\.se/i, "")),
    imageUrl: row.imageUrl,
    url: SITE,
    ticketUrl: row.ticketUrl,
    notes: row.meta.length ? row.meta : undefined,
  };
}

/**
 * Hypnos Theatre (small cinema and stage in Sofielund): screenings, talks
 * and performances from its home page, one request.
 */
async function getHypnosEvents(): Promise<MalmoEvent[]> {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  return parseHypnosPage(LIVE_MODE ? await fetchText(ID, SITE) : demoHtml())
    .map(hypnosRowToEvent)
    .filter((e) => Date.parse(e.endsAt ?? e.startsAt) >= cutoff);
}

export const hypnos: EventSource = {
  id: ID,
  name: "Hypnos Theatre",
  homepage: SITE,
  description: "Hypnos Theatre's screenings, talks and performances, from the calendar links on its home page.",
  kind: LIVE_MODE ? "html" : "fixture",
  endpoint: SITE,
  demo: !LIVE_MODE,
  fetchEvents: getHypnosEvents,
};

/** Two rows in the page's markup, dated from today. */
function demoHtml() {
  const stamp = (days: number, hour: number) => {
    const d = new Date(Date.now() + days * 86_400_000);
    d.setUTCHours(hour, 0, 0, 0);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };
  const row = (id: number, title: string, days: number, meta: string) => `
<div class="screening-row cat-3">
  <div class="screening-top-line"><span class="screening-film-title">${title}</span></div>
  <div class="screening-body">
    <div class="screening-tags"><a class="tag tag-neutral" href="https://bio.se/biografer/hypnos">100-120 SEK ↗ Bio.se</a></div>
    <button class="details-toggle" data-target="screening-details-${id}">More Details</button>
    <a href="https://www.google.com/calendar/render?action=TEMPLATE&#038;text=${encodeURIComponent(title)}&#038;dates=${stamp(days, 18)}%2F${stamp(days, 20)}">Google Calendar</a>
  </div>
  <div class="screening-details" id="screening-details-${id}"><p class="screening-meta">${meta}</p><div class="screening-description"><p>A night at Hypnos.</p></div></div>
</div>`;
  return `<div class="screenings-list">${row(1, "DAUGHTERS OF DARKNESS", 3, "Harry Kümel, 1971 · 96'")}${row(2, "THE ROCKY HORROR PICTURE SHOW", 5, "Jim Sharman, 1975 · 100'")}</div>`;
}
