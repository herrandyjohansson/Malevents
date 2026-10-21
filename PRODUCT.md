# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People in Malmö deciding what to do: residents and visitors alike (tourists, newcomers) who may not know the venues or neighbourhoods yet. The typical moment is on a phone, deciding about tonight or the coming weekend; planning further ahead also happens, on desktop as well.

## Product Purpose

Make it easy to find events around Malmö and act on them. Malevents gathers listings from the city's venue sites and ticket pages into one place, so a visitor can see what's on tonight, this weekend or on a chosen date, by kind of event and by area, and then get tickets, save it, add it to a calendar or find the way there. Success is a visitor finding something worth going to within seconds, and trusting that the listing is current and correct.

## Positioning

One current overview of Malmö's events across venues that otherwise each publish their own listings, organised by when and where in the city rather than by which venue or ticket site sells it.

## Operating Context

- Visitors browse on the move and on the sofa; mobile is the primary device, desktop is used for planning.
- Visitors may not know Malmö's areas or venue names, so places are explained by area and shown on a map.
- Upstream sites own the tickets: Malevents links out to buy, it does not sell.
- Data refreshes from upstream on a schedule; some sources occasionally fail or lack details (start time, location).

## Capabilities and Constraints

- Next.js on Vercel; no accounts, no database, no API keys. Saved events and Admin mode live in the visitor's browser.
- Sources are scraped or read from public feeds (see README); coverage is limited to the registered sources, and some events lack coordinates, start times or descriptions.
- Interface language: English. Swedish stays where it is a name: venues, event titles, areas such as Möllan and Västra Hamnen.
- Browsing by area uses everyday area names (Centrum, Möllan, Västra Hamnen, Davidshall & Triangeln, Rosengård & Värnhem, Limhamn, Hyllie), derived from venue coordinates; borders are approximate.
- Navigation: five tabs, Tonight first: Tonight, Discover, Map, Venues, Saved. The week view and calendar live inside Discover.
- Free, keyless tools and data sources only, unless a paid one is clearly worth it.
- `/admin` is an unprotected internal tool, hidden behind a per-browser toggle; it is not part of the visitor experience.

## Evidence on Hand

- Live event data from the registered sources, typically 800–900 upcoming events across about 7 active sources.
- Event images, venue names, prices in kronor, sold-out flags and ticket links as the upstreams provide them. Descriptions exist only for some events.
- No testimonials, user counts or press. None may be invented.

## Product Principles

1. Events first: every screen leads with something you could go to, not with controls or explanation.
2. When and where are the two questions; tonight is the most common answer to the first.
3. Say only what the data supports: mark cancelled, sold-out and unknown times honestly, never guess.
4. Speak the visitor's language, not the pipeline's: areas and kinds of events, not sources and adapters.
5. Every event leads somewhere useful: tickets, saving, calendar or directions.

## Accessibility & Inclusion

WCAG 2.2 AA for the visitor-facing site: keyboard and screen-reader use, 44 px touch targets on mobile, sufficient contrast on the dark theme, reduced-motion support.
