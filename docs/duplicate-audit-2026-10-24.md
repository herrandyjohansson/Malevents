# Event and venue duplicate investigation

## Summary

**Duplicates remain after aggregation.** In a fresh live snapshot of **1,718
upcoming listings**, shared event URLs or Tickster booking IDs link **82 listings
into 38 likely occurrence groups**. Those groups contain an estimated **44 extra
listings**, or **2.56%** of the upcoming feed.

These are **identity-supported candidates**, not 44 independently verified
cancellations or records safe to delete. Shared booking pages can cover more than
one performance. The report deliberately separates them from weaker title and
location matches.

The biggest observed issues are:

1. Listings from different sources use different titles for the same booking ID.
2. A systematic one-hour start-time disagreement prevents otherwise matching
   city-calendar and venue listings from merging.
3. Venue names are slugged independently, creating separate pages for aliases
   such as Slagthuset / Slagthusets Teater.

**No production deduplication, event data, source settings or venue routing was
changed during this investigation.**

## Snapshot and coverage

- Final capture: **24 October 2026, 19:58:38–19:59:03 Europe/Stockholm**
  (`17:58:38.907Z–17:59:03.025Z`).
- Ran the real `getAllEvents("complete")` pipeline, including normalisation,
  coordinate enrichment, excluded-area filtering, source settings, timeouts and
  the existing merge logic.
- Only Next.js cache runtime APIs were stubbed, so adapters fetched fresh public
  upstream data rather than the development server's existing cache.
- Upcoming means the existing `isUpcoming` rule, pinned to capture start.
- An earlier capture at 19:57 returned the same raw/merged/upcoming totals.
  The final diagnostic rules were replayed on the saved final snapshot.
- This is a dated local measurement, not an assertion about production's current
  cache or every event in Malmö.

| Metric | Count |
| --- | ---: |
| Registered sources | 18 |
| Successful enabled sources | 15 |
| Failed enabled sources | 1 |
| Disabled sources | 2 |
| Normalised input records from successful sources, including ended events | 1,787 |
| Records removed by the existing aggregator | 54 |
| Records after aggregation, including ended events | 1,733 |
| Upcoming records after aggregation | 1,718 |
| Upcoming venue slugs | 106 |
| Repeated exact-ID groups after aggregation | 0 |
| Normalised-title / UTC-minute collision groups after aggregation | 0 |

### Source coverage

Counts below are before aggregation and include ended events.

| Source | State | Records |
| --- | --- | ---: |
| malmo-stad | OK | 265 |
| malmo-live | OK | 123 |
| slagthuset | OK | 67 |
| moriska | OK | 58 |
| malmo-opera | OK | 235 |
| malmo-stadsteater | OK | 113 |
| inkonst | OK | 28 |
| malmo-konsthall | OK | 26 |
| skanes-dansteater | OK | 68 |
| plan-b | OK | 10 |
| spegeln | OK | 277 |
| panora | OK | 169 |
| medley | Timeout after 8 seconds | 0 |
| malmo-arena | OK | 45 |
| hypnos | OK | 24 |
| tickster-malmo | OK, partial detail enrichment | 279 |
| ticket-marketplace | Disabled | 0 |
| skane-culture | Disabled | 0 |

Medley is missing, so these counts do not cover it. Tickster reported that only
the first 150 of 279 detail pages were read; missing detail links and venue
metadata can hide additional matches.

## How duplicates were measured

The tests use three independent signals. Their counts **overlap and must not be
added together**.

### 1. Shared event identity: stronger evidence

Two records from different sources are linked when they:

- start on the same Stockholm calendar day;
- start within 120 minutes of one another;
- share a canonical event URL or Tickster booking ID.

Canonical URLs ignore `www`, trailing slashes, fragments and common tracking
parameters, but retain identifying query parameters. Tickster IDs are extracted
across public event URLs and locale-prefixed booking URLs. Root/homepage links
are ignored.

Connected listings form occurrence candidate groups; a three-listing group has
two surplus rows, not three surplus events.

| Identity-supported measure | Count |
| --- | ---: |
| Linked record pairs | 44 |
| Distinct participating listings | 82 |
| Likely occurrence groups | 38 |
| Groups containing two listings | 32 |
| Groups containing three listings | 6 |
| Estimated surplus listings (`sum(group size - 1)`) | 44 |

The equality between 44 pairs and 44 surplus listings happens in this dataset;
those metrics are not generally equivalent.

| Sources in each linked pair | Pairs |
| --- | ---: |
| malmo-stad + slagthuset | 25 |
| slagthuset + tickster-malmo | 8 |
| malmo-stad + skanes-dansteater | 5 |
| malmo-stad + malmo-stadsteater | 2 |
| malmo-stad + tickster-malmo | 2 |
| malmo-live + malmo-stad | 1 |
| malmo-stad + moriska | 1 |

Examples:

| Date | Listings | Shared identity / finding |
| --- | --- | --- |
| 24 Oct | The Umbilical Brothers / The Umbilical Brothers - The Distraction | Tickster `zxbzzfgjayc214v`; identical start instant, different title and venue name |
| 30 Oct | Elvis, Elvis, Elvis! / Elvis, Elvis, Elvis! - 2026 / city listing | Tickster `nan25y64l2c34wj` links venue/ticket records; the venue URL links the city record, one hour later |
| 7 Nov | Kardborreshowen \| Per Andersson / Kardborreshowen med Per Andersson / city listing | Tickster `zl6g4bju869hh5m` plus the shared venue event URL |
| 13 Nov | Sparkling & Wine 2026 / Sparkling & Wine Malmö 2026 / city listing | Tickster `dbedwrdjrv7tf4p` plus the shared venue event URL |
| 15 Nov | Rollspelsklubben SKRÄCK! / Skräck! / city listing | Tickster `rhl4x8w1n0k9kw5`; titles alone miss the ticket listing |
| 24 Nov | Maggie Reilly / Maggie Reilly + Cutting Crew / city listing | Tickster `1e9f4bd8z540mbt`; city time differs by 65 minutes |
| 17 Jan 2027 | Kevin Bridges / Kevin Bridges Here If You Need Me - European Tour 2026/27 | Same Slagthuset event URL, one-hour time disagreement |

### 2. Similar title, day and venue: review queue

This broader check requires the same Stockholm day, starts within 120 minutes,
and a matching venue slug, coordinates within 100 metres, or a venue-name prefix
such as Slagthuset / Slagthusets Teater. Titles must match after case, accent,
spacing and punctuation folding, or share at least two distinct words with a
token-set Jaccard similarity of at least 0.6.

| Title/location candidate class | Pairs |
| --- | ---: |
| Same title, different sources, different times | 32 |
| Similar title, different sources, same time | 6 |
| Similar title, different sources, different times | 9 |
| Same title, same source, different times | 32 |
| Similar title, same source, same time | 6 |
| Similar title, same source, different times | 5 |
| **Total candidate pairs** | **90** |
| **Distinct participating listings** | **157** |

The union of title/location and shared-identity checks involves **173 distinct
listings**. This is a review workload, **not 173 duplicate events**.

Important non-duplicates / ambiguous candidates:

- Spegeln lists *Resan till Piemonte* at 16:30 and 18:00 on 25 October. Separate
  screenings must not be merged just because the title and cinema match.
- Malmö Live's *Babyrytmik omgång 2* has 09:30, 10:30 and 11:30 sessions on
  5 November. Three sessions produce three candidate pairs.
- *Sagostund med Hanna Albrektson* and *Workshop med Hanna Albrektson* are
  different activities despite shared words and a short time gap.
- A festival introduction, main performance and after-talk can legitimately
  share most of their titles and a location.
- Members/non-members tickets and entrance/poster products can be separate
  ticket products for one public event. That needs a product-level policy.

### 3. Venue candidates

The audit found **18 pairs of venue slugs** with coordinates within 50 metres or
a related name prefix. This is not a count of 18 duplicate venues.

The user's Slagthuset case is especially visible:

| Displayed venue | Upcoming listings | Observed sources |
| --- | ---: | --- |
| Slagthuset | 97 | slagthuset, malmo-stad, tickster-malmo |
| Slagthusets Teater | 42 | tickster-malmo |
| Slagthuset Nöje & Event | 1 | tickster-malmo |
| Slagthuset - Restaurang | 10 | tickster-malmo |
| Slagthuset - Saluhallen | 9 | tickster-malmo |

These **159 listing rows across five venue slugs** are not 159 unique events.
The shared Tickster IDs above show that at least some Slagthuset and Slagthusets
Teater listings refer to the same show. Restaurant and hall labels may represent
real subvenues and should retain room information even if a parent venue groups
them. Four name-prefix candidate pairs connect Slagthuset to the four variants.
The variants mostly lack coordinates, so a coordinates-only audit misses them.

Other alias candidates include:

- Malmö Live Konserthus (123 listings) / Malmö Live (2).
- Biograf Panora (1) / Panora (164).
- Hipp (Malmö stadsteater) (2) / Hippodromen, Malmö Stadsteater (20).
- Hyllie Bryggeri / Hyllie Bryggeri AB.
- Dansstationen / Dansstationen på Palladium.

**Do not merge by coordinates alone.** The data puts Malmö Konsthall and Grand
Malmö 34 metres apart, and Intiman, Malmö Opera and Studion at identical
coordinates. Distinct venues or rooms can share a building or coarse coordinates.

## Why the existing code misses these

### Exact title + minute is too narrow

[`aggregate.ts`](../src/lib/events/aggregate.ts) keys a record by its normalised
title and exact UTC start minute. It does not compare event URLs, booking IDs or
venue aliases. This explains why *Skräck!* and *Rollspelsklubben SKRÄCK!* survive
despite sharing a booking ID.

The key also omits venue identity. The opposite risk exists: two unrelated events
with the same generic title and exact start instant can be merged. This audit did
not establish how many, if any, of the 54 removed records were false merges.

### One-hour disagreements are systematic, but their origin is not yet proven

Of the **44 identity-linked pairs**, **32 differ by exactly 60 minutes**.
The remaining gaps are 0 minutes (8), 30 (1), 55 (1), 65 (1), and 90 (1).

For example, *Elvis, Elvis, Elvis!* is:

- Slagthuset: `2026-10-30T19:30:00+01:00` = 18:30 UTC, 19:30 Malmö.
- Malmö stad: `2026-10-30T19:30:00.000Z` = 20:30 Malmö.

The same wall-clock digits appear with different timezone semantics.
[`malmo-stad.ts`](../src/lib/events/sources/malmo-stad.ts) converts the upstream
`sortDateTime` directly to an ISO timestamp, whereas the Slagthuset adapter
converts a local day/time using the Malmö timezone helper.

This strongly warrants a city-calendar timestamp investigation. It does **not**
justify subtracting one hour globally: upstream epochs might be wrong, source
listings might disagree, and summer time, doors/show times and exceptions must
be checked against the upstream's displayed times first.

### Venue slugs are derived from display names

[`venue-data.ts`](../src/lib/events/venue-data.ts) groups events by
`venueSlug(event.venue.name)`. Accent/punctuation folding does not know that
Slagthusets Teater is associated with Slagthuset. Coordinate enrichment in
[`venues.ts`](../src/lib/events/venues.ts) does not establish canonical venue IDs.

Search indexes these already-separated records; it is exposing pipeline
duplication, not manufacturing extra copies of one document ID.

## Recommended next steps

1. **Verify city-calendar timezone semantics** against displayed local times,
   adding winter, summer and DST-boundary regression fixtures before changing
   conversion.
2. **Use shared upstream identities as dedupe evidence**, with occurrence/date
   guards, source provenance and an explicit preference for authoritative time
   data. Preserve old event IDs/links for saved events and inbound URLs.
3. **Introduce reviewed venue aliases and parent/room relationships**, starting
   with Slagthuset. Keep restaurant, hall and theatre labels where useful.
4. **Use fuzzy title matches for review, not unconditional deletion.** Preserve
   film screenings, repeat sessions, introductions and after-talks.
5. Re-run this diagnostic after each change. Track both duplicate reduction and
   false merges; do not optimise only for a lower event count.

## Tests and reproduction

Added files:

- [`duplicate-audit.ts`](../src/lib/events/duplicate-audit.ts): diagnostic rules;
  not imported into the production aggregation path.
- [`duplicate-audit.test.ts`](../src/lib/events/duplicate-audit.test.ts): 10
  deterministic tests covering exact IDs, title variants, venue aliases,
  different days/places, Stockholm midnight, shared booking IDs, URL
  normalisation, query identity and three-record group counting.
- [`duplicate-audit.live.test.ts`](../src/lib/events/duplicate-audit.live.test.ts):
  opt-in real-pipeline snapshot with source statuses and before/after counts.
- [`duplicate-audit.snapshot.test.ts`](../src/lib/events/duplicate-audit.snapshot.test.ts):
  opt-in offline replay against a pinned snapshot.

Offline rule tests:

```bash
npm test -- src/lib/events/duplicate-audit.test.ts
```

Fresh measurement (uses current source settings and real upstream sites):

```bash
DUPLICATE_AUDIT_LIVE=1 \
DUPLICATE_AUDIT_OUTPUT=/tmp/moevents-duplicate-snapshot.json \
npm test -- src/lib/events/duplicate-audit.live.test.ts
```

Deterministic replay (no network):

```bash
DUPLICATE_AUDIT_INPUT=/tmp/moevents-duplicate-snapshot.json \
DUPLICATE_AUDIT_ANALYSIS=/tmp/moevents-duplicate-analysis.json \
npm test -- src/lib/events/duplicate-audit.snapshot.test.ts
```

The saved snapshot and replay JSON are attached to the task separately rather
than committing full upstream event content. The snapshot retains the raw-stage
audit summary, aggregated upcoming records, source coverage and timestamps; the
replay JSON contains the final shared-link pairs, groups and venue candidates.
Snapshot-local IDs identify each record for inspection.

Validation: 10 rule tests plus the fixed-snapshot replay passed; the live
pipeline measurement passed; ESLint and TypeScript checks passed.
