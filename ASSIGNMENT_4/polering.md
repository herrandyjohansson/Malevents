# ✨ Steg 3 – Polering: fynd i kodbasen

**Datum:** 2 november 2026 · **Kodbas:** `main` @ `3587b37` (~13 400 rader TypeScript i `src/`)

**Så gjordes granskningen:** sökning per kategori i hela `src/` (externa anrop, JSON-tolkning, lagring, felmeddelanden, hårdkodade värden, kommentartäthet, tillgänglighet, loggning). Hela datakedjan lästes rad för rad (`http.ts`, `fetch-source.ts`, `fetch-page.ts`, `crawl.ts`, `scrape.ts`, `aggregate.ts`), liksom de källadaptrar som läser JSON. Felaktiga och okända URL:er testades mot ett lokalt produktionsbygge. Fynd märkta **✔ testat** är bekräftade genom körning, inte bara genom kodläsning.

**Prio:** 🔴 Hög – besökaren märker det eller sajten kraschar · 🟠 Medel – fel döljs eller blir svåra att förstå · 🟢 Låg – städning och robusthet

**Status:** ✅ åtgärdat 2 november 2026 · ➖ ingen ändring behövdes (se fyndet)

| Kategori | Antal |
| -------- | :---: |
| 1. Saknad felhantering för externa anrop | 3 |
| 2. Otydliga felmeddelanden | 6 |
| 3. Edge cases som inte hanteras | 6 |
| 4. Saknad eller otillräcklig dokumentation | 2 |
| 5. Hårdkodade värden | 2 |
| 6. Egna preferenser (loggning, OWASP, tillgänglighet, `report.warn`) | 4 |
| **Totalt** | **23** |

---

## 1. Saknad felhantering för externa anrop

| # | Fil och rad | Fynd | Åtgärd | Prio | Status |
| - | ----------- | ---- | ------ | :--: | :----: |
| 1.1 | [http.ts:150](../src/lib/events/http.ts#L150) | Fel *medan svaret läses* (timeout eller avbruten anslutning mitt i nedladdningen) översätts inte till `SourceError`. Loggen får orsaken `other` och admin visar råtexter som "terminated" eller "The operation was aborted due to timeout". | Lägg `readText` i en try/catch som gör `TimeoutError` till `SourceError(..., "timeout")` och övriga fel till `SourceError(..., networkMessage(err), "network")`, precis som för anslutningsfel på rad 138–144. | 🟠 | ✅ |
| 1.2 | [crawl.ts:48](../src/lib/events/crawl.ts#L48) | `parse` och `hasNextPage` körs utan skydd. Om sida 5 av en listning har oväntad HTML fallerar hela källan, trots att sida 1–4 lästes utan problem. | För `page > 0`: lägg `parse`/`hasNextPage` i try/catch, anropa `report.warn("Listing page N couldn't be read …")` och avsluta med det som hunnit läsas (`stop = "page_failed"`). | 🟠 | ✅ |
| 1.3 | [panora.ts:81](../src/lib/events/sources/panora.ts#L81), [malmo-live.ts:96](../src/lib/events/sources/malmo-live.ts#L96) | JSON-svarets form kontrolleras inte. Om API:et svarar `{}` eller med något annat än en lista blir felet i admin "Cannot read properties of undefined (reading 'flatMap')" eller "rows.filter is not a function". | Kontrollera med `Array.isArray` och kasta `new SourceError(ID, "Unexpected response: no list of films", "invalid_json")`. | 🟢 | ✅ |

## 2. Otydliga felmeddelanden

| # | Fil och rad | Fynd | Åtgärd | Prio | Status |
| - | ----------- | ---- | ------ | :--: | :----: |
| 2.1 | [events/[id]/page.tsx:17](../src/app/events/%5Bid%5D/page.tsx#L17) och [:48](../src/app/events/%5Bid%5D/page.tsx#L48) | **✔ testat, men fel diagnos.** En trasig länk som `/events/%E0%A4%A` ger HTTP 500 lokalt, men felet uppstår i Next.js egen router innan sidan körs (svaret är ren text: "Internal Server Error"). **I produktion stoppar Vercel länken redan i sin edge (HTTP 400) innan den når appen.** `decodeURIComponent` i sidan nås alltså aldrig med en trasig länk. | Ingen ändring i koden: den föreslagna `safeDecode` provades och togs bort igen, eftersom den aldrig kan köras. | 🟢 | ➖ |
| 2.2 | `src/app/not-found.tsx` saknas | **✔ testat:** okända venues (`/venues/no-such-venue`), dagar (`/days/banana`) och sidor visar Next.js standardtext "404 – This page could not be found." Den skiljer sig från sajtens egen, vänligare "event saknas"-sida. | Lägg till `app/not-found.tsx` i samma stil som [event-missing.tsx](../src/components/events/event-missing.tsx), med länkar till Tonight, Discover och Venues. | 🟠 | ✅ |
| 2.3 | [leaflet-map.tsx:299](../src/components/map/leaflet-map.tsx#L299) och [:335](../src/components/map/leaflet-map.tsx#L335) | När "Near me" misslyckas blir ikonen bara röd. Förklaringen finns i en tooltip (syns inte på mobil) och i skärmläsartext, och den säger inte om platsen blockerades eller bara tog för lång tid. | Läs `e.code` från `locationerror` och visa en synlig rad: kod 1 → "Location is blocked – allow it in your browser settings", kod 2/3 → "Couldn't find your location – try again". | 🟠 | ✅ |
| 2.4 | [event-results.tsx:137](../src/components/events/event-results.tsx#L137) | När det inte finns några evenemang alls (alla källor nere, kall cache) skyller sidan på filtren: "No events match these filters – Try a wider time …". | Om `upcoming.length === 0`: visa "No events to show right now – check back in a minute" utan filterråd. | 🟠 | ✅ |
| 2.5 | [saved.ts:39](../src/lib/saved.ts#L39) | Om webbläsaren blockerar eller har fullt i `localStorage` misslyckas sparandet tyst: hjärtat tänds inte, och ingen förklaring visas. | Låt `write` returnera `false` vid fel och visa ett kort meddelande: "Couldn't save – your browser is blocking storage (private mode?)". | 🟢 | ✅ |
| 2.6 | [error.tsx:15](../src/app/error.tsx#L15) | Felsidan säger alltid "We couldn't load events right now", även när felet sker på sidor som inte laddar evenemang (till exempel Saved). | Neutral text: "This page couldn't be shown right now", behåll "Try again" och lägg till en länk till Tonight. | 🟢 | ✅ |

## 3. Edge cases som inte hanteras

| # | Fil och rad | Fynd | Åtgärd | Prio | Status |
| - | ----------- | ---- | ------ | :--: | :----: |
| 3.1 | [saved.ts:27](../src/lib/saved.ts#L27) | `read()` kontrollerar bara `id` och `title`. En sparad post utan giltigt `startsAt` (äldre version eller ändrad lagring) kraschar hela Saved-fliken: `localeCompare` på [saved-list.tsx:49](../src/components/saved/saved-list.tsx#L49) och `localDay(new Date(...))` på rad 77. | Kräv också `typeof startsAt === "string" && !Number.isNaN(Date.parse(startsAt))` och `typeof url === "string"`; filtrera bort resten. Lägg till ett test. | 🔴 | ✅ |
| 3.2 | [fetch-source.ts:82](../src/lib/events/fetch-source.ts#L82) | En källa som returnerar **0 evenemang** räknas som lyckad, visas som *Healthy* i admin och cachas i timmar. Har en venue gjort om sin sajt så att tolkningen inte hittar något, syns det inte. | Om en live-källa returnerar 0 evenemang: lägg till varningen "No events found – the page layout may have changed" och använd en kort cachetid. | 🟠 | ✅ |
| 3.3 | [filters.ts:95](../src/lib/events/filters.ts#L95) | `src` (listningssajt) i URL:en kontrolleras inte, till skillnad från kategorier och områden. En okänd sajt, eller en som är nere just nu, ger en tom lista med chipet "1 listing site" och råd om tid och område. | Släpp id:n som inte finns bland `listedSources(sources)` på servern, eller säg i tomvyn att sajten inte har några evenemang just nu. | 🟢 | ✅ |
| 3.4 | [tonight/page.tsx:116](../src/app/tonight/page.tsx#L116) | När inget är kvar i dag *och* morgondagen är tom lovar rubriken ändå "Quiet now. Tomorrow has more.", ovanför texten "Nothing listed for tomorrow yet" (rad 162). | Skriv bara "Tomorrow has more" om `tomorrowEvents.length > 0`, annars "Nothing listed yet." | 🟢 | ✅ |
| 3.5 | [scrape.ts:61](../src/lib/events/scrape.ts#L61) | **✔ testat:** dag 31 godkänns i alla månader, så "31 nov" i en listning blir tyst 1 december. | Jämför dagen med månadens längd (`new Date(Date.UTC(year, month, 0)).getUTCDate()`) och returnera `undefined` om den är för stor. | 🟢 | ✅ |
| 3.6 | [venues/[slug]/page.tsx:63](../src/app/venues/%5Bslug%5D/page.tsx#L63) | En delad länk till en venue ger 404 när venuens enda källa är nere, eftersom venues bara byggs från evenemang. | Om slugen finns i `venues.ts`: visa venuesidan med "No upcoming events right now" i stället för 404. | 🟢 | ✅ |

## 4. Saknad eller otillräcklig dokumentation

| # | Fil och rad | Fynd | Åtgärd | Prio | Status |
| - | ----------- | ---- | ------ | :--: | :----: |
| 4.1 | [duplicate-audit.ts:19–70](../src/lib/events/duplicate-audit.ts#L19) | 149 rader med en enda kommentar. Gränsvärdena saknar förklaring: venuenamn-prefix ≥ 6 tecken, 100 m mellan platser, ≥ 2 gemensamma ord och 60 % överlapp i titlar. Det framgår inte heller att `linkedGroups` slår ihop par till grupper som hänger ihop. | Doc-kommentarer per funktion som förklarar regeln och varför den finns, och gränsvärdena som namngivna konstanter. | 🟢 | ✅ |
| 4.2 | [fetch-source.ts:45](../src/lib/events/fetch-source.ts#L45) | Inaktuell efter den skrivskyddade adminen: "so the admin can refresh one source". | Ändra till "so `vercel cache invalidate --tag events:<id>` can refresh one source". | 🟢 | ✅ |

## 5. Hårdkodade värden som borde vara konfigurerbara

| # | Fil och rad | Fynd | Åtgärd | Prio | Status |
| - | ----------- | ---- | ------ | :--: | :----: |
| 5.1 | [spegeln.ts:111](../src/lib/events/sources/spegeln.ts#L111), [slagthuset.ts:134](../src/lib/events/sources/slagthuset.ts#L134), [malmo-live.ts:97](../src/lib/events/sources/malmo-live.ts#L97), [hypnos.ts:109](../src/lib/events/sources/hypnos.ts#L109), [panora.ts:83](../src/lib/events/sources/panora.ts#L83) | `6 * 60 * 60 * 1000` (behåll evenemang som började för upp till 6 timmar sedan) är kopierat i fem adaptrar. | En konstant `RECENT_EVENT_GRACE_MS` i `config.ts` som adaptrarna importerar. | 🟢 | ✅ |
| 5.2 | [http.ts:170](../src/lib/events/http.ts#L170), [:187](../src/lib/events/http.ts#L187), [jsonld.ts:73](../src/lib/events/jsonld.ts#L73) | Standardtimeouten per anrop, `8000`, står på tre ställen. `config.ts` har redan `DEFAULT_SOURCE_TIMEOUT_MS = 8000`, men den gäller hela källan. | `DEFAULT_REQUEST_TIMEOUT_MS` i `config.ts`, som används på alla tre ställena. | 🟢 | ✅ |

## 6. Egna preferenser

| # | Fil och rad | Fynd | Åtgärd | Prio | Status |
| - | ----------- | ---- | ------ | :--: | :----: |
| 6.1 | **report.warn** – [hypnos.ts:59](../src/lib/events/sources/hypnos.ts#L59), [malmo-arena.ts:63](../src/lib/events/sources/malmo-arena.ts#L63), [malmo-live.ts:99](../src/lib/events/sources/malmo-live.ts#L99), [panora.ts:50](../src/lib/events/sources/panora.ts#L50), [spegeln.ts:78](../src/lib/events/sources/spegeln.ts#L78) | Rader utan datum eller titel släpps tyst. Ändrar en sajt hälften av sin HTML syns källan som *Healthy* med färre evenemang, och admin får ingen varning. Moriska, Tickster och Slagthuset rapporterar redan sådant. | Räkna överhoppade rader och anropa `report.warn("N of M listings skipped: no date")` när N > 0. | 🟠 | ✅ |
| 6.2 | **OWASP D1** – `package-lock.json`, [docs/security-owasp.md](../docs/security-owasp.md) | `npm audit --omit=dev` rapporterar en hög sårbarhet: `undici` ≤ 7.30 via `cheerio`, som används i produktion. D1-raden i säkerhetsdokumentet är inaktuell: den säger "inga" och nämner `braces`, som inte längre finns. | Uppdatera `undici` (`npm audit fix` eller en override), kör om testerna och skriv om D1-raden. | 🟠 | ✅ |
| 6.3 | **Loggning** – [instrumentation.ts:7](../src/instrumentation.ts#L7) | `server.started` loggar inte vilka källor som är avstängda via `EVENTS_DISABLED_SOURCES`, så det syns inte i Vercels loggar varför en källa saknas. *(Inga loggar innehåller besökarens indata – det är OK.)* | Lägg till `disabledSources: DISABLED_SOURCE_IDS` i loggraden. | 🟢 | ✅ |
| 6.4 | **Tillgänglighet (WCAG 2.4.7)** – [sparkline.tsx:47](../src/components/admin/logs/sparkline.tsx#L47) | Diagrammet kan nås med tangentbordet (`tabIndex={0}`) men har `outline-none`, så man ser inte var fokus är. *(Bilder utan alt-text är dekorativa och har korrekt `alt=""`.)* | Lägg till `focus-visible:ring-2 focus-visible:ring-ring rounded-sm`. | 🟢 | ✅ |

---

## Åtgärdat

**22 av 23 fynd är åtgärdade.** Fynd 2.1 visade sig vara fel diagnos: felet ligger i Next.js router, och Vercel stoppar sådana länkar innan de når appen.

**Nytt i koden**

- `src/app/not-found.tsx` – egen 404-sida, samma kort som "event saknas" (komponenten `Missing` i `event-missing.tsx`)
- `src/lib/events/report.ts` – `reportSkipped`, som varnar i admin när rader i en listning hoppas över
- `parseSaved` i `saved-snapshot.ts` – kontrollerar sparade evenemang innan Saved-fliken visar dem
- `knownVenueName` i `venues.ts` – en känd venue utan evenemang får en sida i stället för 404
- `DEFAULT_REQUEST_TIMEOUT_MS` och `RECENT_EVENT_GRACE_MS` i `config.ts`
- `undici` 7.30.0 → 7.30.1 i `package-lock.json` (bara den raden)

**Verifiering**

- `npm run lint`, `npx tsc --noEmit` och `npm run build` går igenom
- `npm test`: 99 godkända (12 nya: `http.test.ts`, `crawl.test.ts`, `scrape.test.ts`, `parseSaved` och `knownVenueName`)
- `npm audit --omit=dev`: 0 sårbarheter
- Lokal körning av bygget: okända sidor, venues och dagar visar den nya 404-sidan; `/venues/turning-torso` visar "Nothing listed at Turning Torso right now"; `/?src=bogus` visar "That listing site has no events right now"; alla flikar och admin svarar 200
- Inte testat i webbläsare: platsfelet på kartan (2.3), sparfel när lagringen är blockerad (2.5) och felsidan (2.6). De bygger på kodgranskning.
