# New event sources for Malmö: analysis

Which further sources could feed Malevents, how each can be read, what it would add, and in what order to build them.

> The current status of every candidate, including later rounds, is kept in [event-source-candidates.yaml](event-source-candidates.yaml), maintained by the `find-malmo-event-source` skill. This page is the write-up of the first round.

**Status 2026-10-21:** #1–#4 are built (`malmo-stad.ts`, `malmo-konsthall.ts` via `events-calendar.ts`, `skanes-dansteater.ts`, `plan-b.ts`). First live run: 291 + 28 + 67 + 10 events, all sources healthy, 1,281 events in total (from about 885). Plan B's public page only carries its featured events (about 10), not the full programme. Researched and probed on 2026-10-21 with the Malevents user agent (`MaleventsBot/1.0`); every endpoint below was requested once and returned what is described. Event counts are snapshots.

## Today's coverage

Live: Malmö Live, Slagthuset, Moriska Paviljongen, Malmö Opera, Malmö Stadsteater, Inkonst and Tickster's Malmö listing (about 880 upcoming events). Demo fixtures only: Malmö stad (`malmo-stad.ts`), Moderna Museet (`skane-culture.ts`) and Malmö Arena (`ticket-marketplace.ts`).

Gaps visible in the data: Family (3 events), Film (1), Art (30) and Talks (12) are thin; museums, libraries, Folkets Park, dance and the big arena are missing; about 25% of events lack coordinates.

## Ranked candidates

| # | Source | What it adds | How to read it | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | **Malmö stad's event calendar** (`malmo.se/evenemang`) | About 110 events a week (~450 a month): Malmö Museum, Moderna Museet Malmö, Konstmuseet, all city libraries, Folkets Park, Victoriateatern, Kulturhyllan and outside organisers. Half are tagged for children and families. | Server-rendered page with the listing as embedded JSON. `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&num=200` returns a whole range in one request (109 items for 8 days). Each item has id, title, description, image, categories, place and room, target groups, accessibility, and start/end as epoch ms. | Low–medium: one request per week of range, parse one JSON array | **Build first.** Replaces the `malmo-stad.ts` demo fixture with live data and fills Family, Talks, Art and Film. |
| 2 | **Malmö Konsthall** (`malmokonsthall.se`) | 28 upcoming events (talks, workshops, family weekends, exhibitions) | WordPress with The Events Calendar: `/wp-json/tribe/events/v1/events` returns JSON with start, end, cost and URL; also an iCal feed at `/evenemang/?ical=1` | Low | **Build.** The cleanest API found; can be a generic "Events Calendar" adapter reusable for other WordPress venues. |
| 3 | **Skånes Dansteater** (`skanesdansteater.se/kalender`) | About 136 dated performances (dance, under Stage) | Drupal page; every performance has `<time datetime="…+02:00">` | Low (cheerio, like the Stadsteater adapter) | **Build.** Dance is missing today. |
| 4 | **Plan B** (`planbmalmo.com`) | Concerts and club nights at one of Malmö's main clubs (about 10 listed) | Next.js page on the broadcast.events platform with the event list embedded as JSON: title, `info` date (`11/12/26`, day only), image, ticket link (Nortic) | Low | **Build**, with `timeUnknown` (no start time in the data); venue coordinates go in `venues.ts`. |
| 5 | **Panora** (`panora.se`) | Talks, panels and workshops at the cinema (`event` type); film screenings (`screening` type) | WordPress REST: `/wp-json/wp/v2/event`; screenings are 19,531 posts including history, with the date only in the title | Low for events; screenings need a date filter the API doesn't offer | **Events only**, later. Screenings would fill Film but need a different approach (the cinema's own programme page). |
| 6 | **Babel** (`babelmalmo.se`) | About 12 upcoming nights (comedy, concerts) | RSS at `/program/kommande/feed`; dates as a `yymmdd :` title prefix | Low | **Low priority**: most Babel events already arrive through Tickster and are de-duplicated. |
| 7 | **Malmö Arena** (`malmoarena.com`) | 45 big concerts and shows | HubSpot site; dates are rendered in the browser, not in the HTML. Tickets via Ticketmaster. | Medium (detail pages) or via Ticketmaster's API (needs a key) | **Decide**: either scrape detail pages, or use the Ticketmaster Discovery API, which needs a free API key, against the project's keyless rule. |
| 8 | **Moderna Museet Malmö** | Exhibitions and events | WordPress REST `event`/`exhibition`, but Stockholm and Malmö are mixed (filter on `/malmo/` in the link) and dates are not in the API | Medium | **Skip for now**: its Malmö events already appear in the city calendar (#1). |
| 9 | **Visit Malmö** (`visitmalmo.se/en/events`) | A curated list linking to venues (Slagthuset, Moriska, Skånes Dansteater, Malmö Arena, MFF, Glasklart) | HTML list | Medium | **Skip**: it points to the same venues; useful only as a checklist of who to cover. |
| 10 | **Grand Malmö** | Gigs | Squarespace event calendar, currently empty; its gigs are sold and listed through Tickster | — | **Already covered** via Tickster. |
| 11 | **Sport**: Malmö FF, Malmö Redhawks, FC Rosengård | Home matches | `mff.se` answers 500 to a bot; the others are JavaScript apps | Medium–high | **Later**: via the Ticketmaster API (#7) or the leagues' fixture lists. |

## Not viable

- **Eventbrite**: its public event search API was retired in 2020; the API only covers an account's own events.
- **Songkick, Bandsintown**: API access needs an approved partner key (Songkick no longer accepts new applications) and Bandsintown's API is per artist, not per city.
- **Resident Advisor**: no public API; its terms forbid scraping.
- **Billetto, Nortic**: no keyless city listing found; Nortic only matters as Plan B's ticket link.

## Notes for building

- All candidates allow these paths in `robots.txt`. Keep to one request per listing page, the existing `MaleventsBot` user agent and the `hours` cache profile; detail pages through `fetchDetailPage`.
- Overlap is expected (Moderna Museet in #1, Babel in Tickster, Slagthuset in #1); `aggregate.ts` de-duplicates on title and start minute, and keeps the richer record.
- New venues need coordinates in `venues.ts` (Plan B, Skånes Dansteater/Dansstationen, Malmö Museum, Folkets Park is there, the libraries); without them events get no area and stay off the map.
- Categories: map the city calendar's own categories ("Konsert", "Teater och scenkonst", "Utställning", "Samtal", "Film") through `toCategory`, and its target group "Barn och familj" to Family.
- Expected effect of #1–#4: roughly +600 events a month, with the thin categories (Family, Talks, Art, dance) filled.

## Sources consulted

- [Malmö stad – evenemangskalendern](https://malmo.se/evenemang) and [Om evenemangskalendern](https://malmo.se/Uppleva-och-gora/Evenemang/Evenemang-i-Malmo/Om-evenemangskalendern.html)
- [Visit Malmö – events](https://www.visitmalmo.se/en/events)
- [Malmö Konsthall – evenemang](https://malmokonsthall.se/evenemang/)
- [Skånes Dansteater – kalender](https://www.skanesdansteater.se/kalender)
- [Plan B Malmö](https://www.planbmalmo.com/)
- [Panora](https://www.panora.se/), [Babel](https://babelmalmo.se/), [Malmö Arena](https://www.malmoarena.com/evenemang), [Moderna Museet Malmö](https://www.modernamuseet.se/malmo/), [Grand Malmö](https://www.grandmalmo.se/)
- Listings used to find venues: [Bandsintown – Malmö](https://bandsintown.com/c/malmo-sweden), [Songkick – Malmö](https://songkick.com/metro-areas/32247-sweden-malmo/this-month)
