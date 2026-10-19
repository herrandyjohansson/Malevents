# Del B – Prompt 2: Säkerhet

> Gå igenom kodbasen och leta efter: hårdkodade hemligheter eller uppgifter, saknad inputvalidering, injection-risker (SQL, kommando, path traversal), känsliga data i loggar, och osäkra standardvärden. Lista varje fynd med filnamn och radnummer.

Endast granskning, inga ändringar gjorda. Appen har ingen databas, inga konton och inga API-nycklar, så attackytan är liten. Det som finns är den oskyddade admin-delen och data som skrapas från tredje part.

## Fynd (allvarligast först)

| # | Kategori | Fil:rad | Fynd | Allvar |
|---|---|---|---|---|
| 1 | Osäkert standardvärde | `src/app/admin/actions.ts:8-33` | Server Actions saknar all behörighetskontroll. Vem som helst kan slå av och på källor och tömma cachen. Admin-läget (`src/lib/admin-mode.ts`) döljer bara fliken. | Hög |
| 2 | Osäkert standardvärde | `src/app/admin/actions.ts:31-33`, `src/app/admin/sources/[id]/page.tsx:46` | `refreshAllSourcesAction` kan anropas upprepat av vem som helst. Varje anrop tömmer cachen för alla källor, så nästa sidvisning skrapar alla ~10 venue-sajter och deras detaljsidor på nytt. Det går att använda för att belasta tredje parts sajter i Malevents namn (`USER_AGENT` i `http.ts:17`). | Hög |
| 3 | Saknad inputvalidering | `src/app/admin/actions.ts:14`, `src/lib/events/settings.ts:27` | `id` kontrolleras mot `SOURCES`, men `enabled` kontrolleras inte. En Server Action tar emot godtycklig serialiserbar data, så t.ex. en sträng eller ett objekt skrivs rakt in i `.data/source-settings.json`. `aggregate.ts:77` läser sedan värdet som truthy. | Medel |
| 4 | Injection (URL-schema) | `src/lib/events/scrape.ts:98`, `src/lib/events/sources/malmo-stad.ts:35`, `src/lib/events/sources/slagthuset.ts:91-92` | Länkar från upstream (`url`, `ticketUrl`, `imageUrl`) kontrolleras aldrig för `http(s):`. `new URL()` accepterar `javascript:` och `data:`. De renderas som `href` i bl.a. `src/components/events/event-card.tsx:54,88`, `src/components/tonight/timeline-event.tsx:36,53`, `src/components/calendar/calendar-view.tsx:218,236` och `src/components/saved/saved-list.tsx:160,178`. React 19 blockerar `javascript:`-länkar, vilket mildrar risken, men skyddet ligger i ramverket och inte i appen. | Medel |
| 5 | Osäkert standardvärde | `next.config.ts:3-20` | Inga säkerhetsheaders: ingen `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` eller `Permissions-Policy`. Sidan kan bäddas in i en iframe (clickjacking mot admin-knapparna). | Medel |
| 6 | Saknad inputvalidering (extern data) | `src/lib/events/http.ts:19-33,46,56` | Svar från upstream har ingen storleksgräns, och `res.json() as T` castas utan validering. En kapad eller trasig venue-sajt kan skicka mycket stora svar eller oväntade former. Timeout finns (8 s), men ingen gräns för mängden data. | Låg |
| 7 | Injection (iCalendar) | `src/lib/ics.ts:18`, `src/lib/ics.ts:48` | `escape()` hanterar `\n` men inte `\r`, och `URL:` skrivs utan escaping. Ett event-namn med `\r` kan i teorin lägga till egna rader i .ics-filen. Datan kommer från användarens egen localStorage, så risken är låg. | Låg |
| 8 | Känsliga data i loggar / UI | `src/lib/events/aggregate.ts:60`, `src/components/events/source-status.tsx:30` | Hela felobjektet loggas, och felmeddelandet visas för alla besökare som `title`-tooltip. I dag innehåller det bara upstream-host och HTTP-status, men allt som en adapter lägger i ett fel blir publikt. Admin-sidorna (oskyddade) visar fullständiga fel. | Låg |
| 9 | Osäkert standardvärde | `src/lib/events/settings.ts:15` | Inställningsfilen ligger under `process.cwd()`. Sökvägen är fast, så det finns ingen path traversal, men på Vercel är filsystemet skrivskyddat eller per instans (se arkitekturfynd 2). | Info |

## Kontrollerat utan anmärkning

- **Hårdkodade hemligheter**: inga. Det enda `process.env` som läses är `EVENTS_LIVE` och `DEMO_SOURCE_FAILURE` (`src/lib/events/config.ts:6`, `src/lib/events/sources/skane-culture.ts:15`). `.env*`, `*.pem` och `.data/` ligger i `.gitignore`.
- **SQL / kommando-injection**: ingen databas, inget `child_process`, ingen `eval`/`new Function`, ingen `dangerouslySetInnerHTML`.
- **Path traversal**: dynamiska parametrar slås upp mot kända listor i stället för att användas som sökvägar: `src/app/venues/[slug]/page.tsx:44` (`find` på slug) och `src/app/admin/sources/[id]/page.tsx:39` (`getSource`).
- **URL-parametrar**: `parseFilters` (`src/lib/events/filters.ts:69-89`) vitlistar kategorier, validerar datum med `isDay`, kapar sökningen till 100 tecken och källor till 30.
- **Externa bilder**: `src/components/events/remote-image.tsx:20` sätter `referrerPolicy="no-referrer"`. Externa länkar har `rel="noopener noreferrer"`.
- **localStorage**: `src/lib/saved.ts:26-27` tål korrupt JSON och filtrerar poster utan `id`/`title`.
- **Beroenden**: `npm audit --omit=dev` → 0 sårbarheter (2026-10-15).

**Kandidater att åtgärda:** 3 (validera `enabled`) och 4 (tillåt bara `http(s):`-länkar) är små och avgränsade. 1–2 kräver ett beslut om autentisering, vilket CLAUDE.md redan flaggar inför publik lansering.
