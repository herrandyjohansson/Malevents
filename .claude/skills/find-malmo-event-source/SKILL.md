---
name: find-malmo-event-source
description: "Find and vet new event sources for MÖEVENTS (Malmö): discover venues and listings not covered yet, find the JSON or feed behind their event pages (with OpenWeb capture when the page renders in the browser), check a server can read it without a browser, key or login, and record the result in docs/event-source-candidates.yaml. Use when asked to find more Malmö events, venues or sources, to check a venue's site, or before writing a new adapter in src/lib/events/sources/."
---

# Find a Malmö event source

Goal: a short, vetted list of sources worth an adapter, recorded in `docs/event-source-candidates.yaml`. This skill researches and reports. It does not write adapters; stop at step 6 and let the user choose.

## 0. Read first

- `docs/event-source-candidates.yaml`: what is built, covered, rejected or open, and where to look. Do not re-probe a candidate checked in the last 30 days unless asked.
- `src/lib/events/sources/index.ts` (`SOURCES`): what is live.
- CLAUDE.md conventions that decide viability: free and keyless only; **no sources or venues in Rosengård** (`isInExcludedArea` in `src/lib/events/areas.ts`); upstream requests go through `http.ts` (public http(s) only).

## 1. Discover

Use `discovery` in the YAML: open the listings and run the searches (fill in `{year}`, `{month}`). Collect venues and organisers in Malmö that have their own event page and are not in `candidates`. Skip:

- anything already `built`, `covered`, `rejected` or `excluded`;
- organisers that sell only through Tickster: `tickster-malmo` already covers them (check by searching the venue on tickster.com);
- venues outside Malmö municipality, and anything in Rosengård (add it as `excluded` so it is not proposed again).

Prefer sources that fill thin categories (family, film, talks, art, sport) or big venues, over one more source for a venue that is already covered.

## 2. Probe the event page

For each candidate, in this order, stopping at the first that works:

1. **Known patterns** with `scripts/check-endpoint.sh <url>`:
   - WordPress: `/wp-json/` lists namespaces; then `/wp-json/wp/v2/types` for an event post type, `/wp-json/tribe/events/v1/events` for The Events Calendar (reuse `events-calendar.ts`).
   - Feeds: `?ical=1`, `/feed`, `.ics` links, `<link rel="alternate">` in the page head.
   - Next.js: `<script id="__NEXT_DATA__">` in the HTML, `/_next/data/<buildId>/…json`.
   - Ticketing widgets: a Tickster organizer page can be read by `tickster.ts` with no new adapter.
2. **OpenWeb capture** when the HTML has no events (rendered in the browser):
   ```bash
   .claude/skills/find-malmo-event-source/scripts/capture.sh <event-page-url> <scratch-dir>/<id> 20
   ```
   It records every request while the page loads, using an empty Chrome profile, and prints the JSON/feed/API ones. Then run `check-endpoint.sh` on the promising URL. If OpenWeb is not installed (`npm install -g @openweb-org/openweb`), use the browser DevTools network tab instead.
3. **HTML** as the last resort: dated markup (`<time datetime>`, schema.org `Event` JSON-LD) that cheerio can read, like `malmo-stadsteater.ts`.

Write captures and downloads to the session scratchpad, never into the repo.

## 3. Vet

A source is viable only if all hold:

- `check-endpoint.sh` returns 200 with data, with no cookies, browser or login. Anything that needs OpenWeb's browser cannot run on Vercel.
- No API key, no paid plan, and `robots.txt` does not disallow the path. If the terms forbid scraping, reject.
- Each event has a title and a date; note whether it has a start time (else `timeUnknown`), end time, price, image, ticket link and room.
- Event links load (open two or three).
- One request per listing page is enough at the `hours` cache profile, or paging is bounded.

Watch for the quirks seen so far: empty strings instead of missing fields (Plan B's `show_start_time`), fields that only appear when another is requested (Slagthuset's `event_medium` needs `featured_media` in `_fields`), feeds that mix several venues (filter by place), local times without an offset (use `malmoLocalToIso`), "UTC" times that are really local because the site's WordPress time zone is "UTC+0" (Medley; compare `start_date` with `utc_start_date`), and CMS URLs with an internal origin such as `http://localhost:8080` (Spegeln's images).

## 4. Overlap

Estimate how many of its events already reach MÖEVENTS: compare a few titles and dates against Tickster's Malmö listing and the city calendar. `aggregate.ts` de-duplicates on title and start minute, so overlap is harmless but adds nothing.

## 5. Record

Update `docs/event-source-candidates.yaml` for every candidate looked at, including rejected ones, with `checked: <today>`, `status`, `transport`, `endpoint`, `events` (a count snapshot) and a one-line `verdict`. Keep the file's existing order and style.

## 6. Report and stop

Give the user a table: source, what it adds (count, categories), endpoint and transport, fields present, runs on Vercel (yes/no), overlap, effort, verdict. Rank by value. Then ask which to build.

## 7. Building (only when the user asks)

Follow CLAUDE.md "To add a source": `sources/<name>.ts` (export the `*ToEvent` mapper), add it to `SOURCES`, coordinates in `venues.ts`. To compare a replacement against an existing adapter, add the venue to `benchmarks/openweb/venues.ts` and run `npm run test:live` and `npm run bench:openweb`. Set the candidate to `built`.
