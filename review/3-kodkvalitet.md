# Del B – Prompt 3: Kodkvalitet

> Identifiera: funktioner som gör mer än en sak, otydlig namngivning (variabler, funktioner, klasser), saknad felhantering för externa anrop, och kod som är svår att läsa utan kommentarer. Lista de fem allvarligaste problemen.

Endast granskning, inga ändringar gjorda. Omfattning: `src/` utom `src/components/ui/` (shadcn). Problem som redan finns i `1-arkitektur.md` och `2-sakerhet.md` (t.ex. `fetch-page.ts` och död kod i `jsonld.ts`) tas inte upp igen. Rangordning efter risk för buggar eller förvirring vid nästa ändring.

## Topp 5

### 1. Fel från externa anrop tystas ner (saknad felhantering)

| Fil:rad | Vad som sväljs |
|---|---|
| `src/lib/events/sources/tickster.ts:149-155` | Detaljsida per event → `.catch(() => ({}))` |
| `src/lib/events/sources/moriska.ts:171` | Detaljsida per event → `.catch(() => ({}))` |
| `src/lib/events/sources/moriska.ts:162` | Hela WordPress-API:t → `.catch(() => [])` |
| `src/lib/events/sources/malmo-opera.ts:83` | Produktionssida → tomma metadata |
| `src/lib/events/sources/malmo-stadsteater.ts:103` | Produktionssida → tomma metadata |
| `tickster.ts:120-123`, `moriska.ts:133-139`, `malmo-opera.ts:59-62`, `slagthuset.ts:105-109` | Sida 2+ i listningen → loopen avbryts |

Att fortsätta vid fel är rätt, men felen loggas aldrig och räknas inte. Källan rapporteras som `ok` i admin (`aggregate.ts:58`) även om alla detaljsidor eller hela Moriskas REST-API fallerat. Då försvinner bilder, priser, beskrivningar och starttider utan att någon ser varför. Det går inte att skilja "sajten har inga fler sidor" från "sajten är nere".

### 2. Saknad starttid blir tyst "00:00" (felhantering, följd av #1)

- `src/lib/events/scrape.ts:55`: `toIso(date, fallbackTime = "00:00")`. Namnet säger inte att en gissning görs.
- `src/lib/events/sources/tickster.ts:165`: Tickster får starttiden från detaljsidan. Om den hämtningen misslyckas (#1), eller om eventet ligger efter de första 150 (`MAX_DETAILS`, rad 20), blir starttiden midnatt.
- Samma fallback finns i `slagthuset.ts:85` och `malmo-live.ts:56`.

Följd i UI: eventet visas som "00:00". På Tonight-sidan räknas slutet som start + 3 h (`src/app/tonight/page.tsx:48`), så eventet försvinner från Tonight efter klockan 03 samma dag, trots att det kanske startar 20:00. `MalmoEvent` har inget sätt att uttrycka "tid okänd".

### 3. Adapterfunktionerna gör allt på en gång (mer än en sak + duplicering)

- `src/lib/events/sources/tickster.ts:140-175` (`getEvents`) väljer fixtures eller live, hämtar listningar, filtrerar på plats, filtrerar och sorterar på datum, hämtar detaljsidor med tak och samtidighet, och mappar till `MalmoEvent`. Allt i en funktion, med `LIVE_MODE`-förgreningar i varje steg.
- Samma mönster finns i `moriska.ts:160-175`, `malmo-opera.ts:76-114` och `malmo-stadsteater.ts:96-135`.
- Pagineringsloopen är kopierad tre gånger med små skillnader: `tickster.ts:109-129`, `moriska.ts:127-153`, `malmo-opera.ts:53-69`.
- "Berika från produktionssida" är identiskt i `malmo-opera.ts:79-86` och `malmo-stadsteater.ts:99-106`.

En rättning i en adapter (t.ex. loggning enligt #1) måste göras på 4–5 ställen och glöms lätt bort i något av dem.

### 4. Tonight-sidan blandar domänlogik och rendering, och "tonight" betyder två saker (mer än en sak + namngivning)

- `src/app/tonight/page.tsx:33-58`: komponenten `Tonight()` klassar alla event i fyra listor (pågår nu, senare, heldag, imorgon), sorterar dem och renderar sidan. Övriga flikar har sin logik i egna moduler (`week-data.ts`, `map-data.ts`, `calendar-data.ts`), men Tonight har ingen motsvarighet.
- `page.tsx:48` räknar sluttid på egen hand. Det är en kopia av `endOf` i `src/lib/events/filters.ts:209-212`, och `DEFAULT_DURATION_MS` finns i tre filer med olika värden: 3 h i `filters.ts:207` och `page.tsx:21`, men 2 h i `src/lib/ics.ts:11`.
- **Två definitioner av "tonight":** filtret `when=tonight` betyder "startar idag kl. 17 eller senare" (`filters.ts:52,178`). Tonight-fliken betyder "startar idag när som helst, eller imorgon före kl. 04" (`page.tsx:20,54`). Samma ord ger olika resultat beroende på var användaren klickar.
- Namn som `tonight` (en boolean), `f` och `tomorrowList` (rad 44-57), plus nästlade ternaries för rubriktexten (rad 84-90), gör blocket svårt att följa.

### 5. Parsning som är svår att läsa utan kommentarer

- `src/lib/events/sources/moriska.ts:86`: `date?.time && /\d{4}/.test(text.slice(date.index, date.index + 25))`. Magiska 25 tecken, och syftet ("lita bara på datumet om det har ett årtal") framgår inte.
- `moriska.ts:82`: prisregex på en rad utan exempel. `moriska.ts:109`: härledningen av `room` från `heading` kräver att man vet att `heading` är "texten före datumet" och inte rubriken.
- `tickster.ts:63-64`: plats-texten klipps med två regex utan förklaring av kortens textformat.
- `src/lib/events/normalize.ts:18-19`: `toCategory` matchar delsträngar, så `"art"` träffar "Mozart", "party" och "start", och `"mat"` träffar "format". Det förklaras inte, utan adaptrar har lagt till egna undantag: `malmo-opera.ts:98-104` (där kommentaren nämner Mozart) och `malmo-stadsteater.ts:118-119` (`art` → `theatre`).

## Övriga fynd (kom inte med på topp 5)

- **Namngivning:**
  - `malmoTime` (`src/lib/events/demo-dates.ts:7`) låter som "klockan i Malmö" men betyder "demo-datum N dagar framåt".
  - `score` (`src/lib/events/aggregate.ts:37`) räknar ifyllda fält.
  - `heading` i `moriska.ts:30` är inte en rubrik.
  - Enbokstavsvariabler (`l`, `d`, `r`, `i`) i långa mappningar, t.ex. `tickster.ts:157-174` och `malmo-opera.ts:88-113`.
- **Duplicerade månadsnamn** på sex ställen: `scrape.ts:9`, `tickster.ts:192`, `malmo-opera.ts:130`, `moriska.ts:192` och `:219`, `src/lib/days.ts:84`.
- **Non-null assertions som vilar på en callback någon annanstans:**
  - `parseSwedishDate(...)!` i `tickster.ts:62`, `moriska.ts:64` och `malmo-opera.ts:39`. Fungerar bara för att `accept` i `findCards` redan har kontrollerat datumet.
  - `attr("href")!` i `malmo-stadsteater.ts:69` och `:78`.
- **Dubbel information om utsålt:** `malmo-live.ts` lägger "Slutsålt." i beskrivningen och sätter samtidigt `soldOut`.

## Kandidater att åtgärda

- **#1 + #2 tillsammans** (mest värde): logga och räkna svalda fel per källa så att admin ser "ok, 12 detaljsidor misslyckades", och markera tid okänd i stället för 00:00.
- **#4, delvis** (litet och avgränsat): låt Tonight använda `endOf`/`isUpcoming` från `filters.ts` i stället för egen kopia, och samla `DEFAULT_DURATION_MS` på ett ställe.
- **#5, delvis** (minst risk): kommentarer och namngivna konstanter för `moriska.ts:82-86`.
