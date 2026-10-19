# Del B – Prompt 1: Arkitektur

> Granska kodbasen mot de arkitekturprinciper jag definierat i CLAUDE.md. Var bryter koden mot principerna? Var är den i linje med dem? Ge konkreta filreferenser.

Endast granskning, inga ändringar gjorda.

## I linje med principerna

- **`server-only`**: alla adaptrar i `src/lib/events/sources/` samt `aggregate.ts`, `settings.ts`, `http.ts`, `fetch-source.ts` importerar det.
- **Ett källregister**: `SOURCES` i `src/lib/events/sources/index.ts:18`, med klientsäker `SOURCE_META` och `isEnabledByDefault` som håller demokällor av i live-läge.
- **Cache**: `src/lib/events/fetch-source.ts:43-58` använder `"use cache: remote"` med `cacheTag("events", "events:<id>")` och cache-profiler. Fel returneras i stället för att kastas och cachas bara i sekunder. Admin rensar med `updateTag` (`src/app/admin/actions.ts:28-32`).
- **Id-format** `<sourceId>:<upstreamId>` i alla adaptrar, t.ex. `malmo-stad.ts:26`, `tickster.ts:161`.
- **Statisk ram + streaming**: alla 8 datasidor har `<Suspense>` och `connection()` i datadelen, t.ex. `src/app/calendar/page.tsx:25-28`. `/saved` är helt klientsidig och behöver det inte.
- **localStorage** via `useSyncExternalStore` med serverläge: `src/lib/saved.ts:54`, `src/lib/admin-mode.ts:30`.
- **Filter i URL**: `src/components/filters/use-filters.ts` och `src/lib/events/filters.ts` används både på servern (Discover) och i webbläsaren (Map, Calendar).
- **Datumetiketter**: `Intl` används bara i komponenter som enbart renderas på servern. Klientvyer får färdiga etiketter från `calendar-data.ts:29-30` och `map-data.ts:37`. `src/lib/days.ts:93` formaterar för hand.

## Brott mot principerna (allvarligast först)

1. **En andra cachad funktion som inte är remote.** `src/lib/events/fetch-page.ts:13` använder vanlig `"use cache"` (minnescache). Det strider mot "fetch-source.ts är den enda cachade funktionen" och mot regeln om `"use cache: remote"`. Det motsäger också motiveringen i `fetch-source.ts:33-36`: på Vercel börjar varje kall instans om, så detaljsidor hämtas om ändå. Påverkar moriska, tickster, malmo-opera och malmo-stadsteater.
2. **Admin-inställningarna fungerar inte där appen körs.** `src/lib/events/settings.ts:5-10` säger själv att modulen ska bytas ut före serverless-drift, men appen ligger på Vercel. På/av-knappen sparas inte i produktion. `/admin` saknar skydd (`src/app/admin/actions.ts:8`). Båda är kända i CLAUDE.md men inte åtgärdade.
3. **Den långsammaste källan blockerar allt.** `src/lib/events/aggregate.ts:77` väntar med `Promise.all` på alla källor. Sidan streamar först när den långsammaste källan är klar eller når sin timeout (upp till 8 s). Streaming sker per sida, inte per källa. Samma problem som Del A §3.
4. **Delbar vy-state ligger inte i URL:en.** Kalenderns månad och valda dag är `useState` (`src/components/calendar/calendar-view.tsx:50-51`). Venues-sök, sortering och kategori också (`src/components/venues/venue-grid.tsx:25-27`). Discover sparar sin sökning i URL:en, Venues gör det inte.
5. **Död kod som går förbi http-lagret.** `src/lib/events/jsonld.ts` importeras ingenstans. `fetchJsonLdEvents` (`jsonld.ts:69-78`) gör ett eget `fetch` utan `User-Agent`, en kopia av `request()` i `src/lib/events/http.ts:19`.
6. **Hand-formateringen följs bara av en slump.** `src/lib/events/format.ts:42-92` bygger på `Intl` men är inte markerad som enbart server. Klientkomponenter importerar redan från den (`filter-bar.tsx:23`, `saved-list.tsx:11`). `saved-list` klarar sig bara för att den renderar efter hydrering. Ett `formatEventDate` i en ny klientkomponent ger en hydreringsbugg. `src/components/week/week-board.tsx:9-10` formaterar med `Intl` det som `days.ts` redan gör för hand.

**Kandidater att åtgärda:** punkt 1 eller 5 är små och avgränsade. Punkt 2–3 är större designfrågor.
