# 🚀 Hemuppgift 4: Deployment, polering och paketering

> **Introduktionskurs AI – Kimmo**
> Introduktionskurs till utveckling med AI-stöd

---

## 📅 Kursöversikt

**Framsteg:** 4 / 5 träffar

| Status | Träff | Datum | Tid |
| :----: | ----- | ----- | --- |
| ✅ | Träff 1 – Systemförståelse | 6 oktober 2026 | 17:00–18:00 |
| ✅ | Träff 2 – Lös din första uppgift | 13 oktober 2026 | 17:00–18:00 |
| ✅ | Träff 3 – Felsökning | 20 oktober 2026 | 17:00–18:00 |
| ✅ | Träff 4 – Leverans och driftsättning | – | – |
| ▶️ | **Träff 5 – Avslutning** *(nästa, demo)* | – | – |

---

## 🧭 Om uppgiften

Den här uppgiften är byggd kring **The 4Ds** och **spec-driven development**: du **beskriver** vad som ska byggas *(Description)*, **delegerar** implementation och pipeline-generering till agenten *(Delegation)*, **granskar och godkänner** varje steg *(Discernment)*, och **äger** att projektet faktiskt fungerar och är deployat *(Diligence)*. Du behöver inte tänka på dem aktivt – men du kommer märka dem när du är klar.

### 📍 Utgångsläge för MÖEVENTS

| Område | Läge idag |
| ------ | --------- |
| Live-URL | <https://moevents.vercel.app> (Vercel, deployas från `main`) |
| Repo | <https://github.com/herrandyjohansson/Malevents> – publikt |
| CI/CD | Ingen GitHub Actions-workflow än (`.github/workflows/` saknas). Vercels preview-build är enda automatiska kontrollen. |
| Kontroller lokalt | `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` |
| Hemligheter | Inga API-nycklar, ingen databas, ingen inloggning |
| Admin | Skrivskyddad – inställningar ändras i Vercel, inte på sajten (se [Go-live](#-go-live-produktionsklar-möevents)) |
| README | Komplett: installation, konfiguration, körning, tester och externa beroenden (se [steg 4](#-steg-4--paketering)) |

---

## ✅ Steg 1 – Färdigställ implementation

Implementera kvarvarande kärnfunktionalitet i ditt projekt. Allt som behövs för att projektet ska vara demonstrerbart vid träff 5 ska vara klart nu.

Använd Claude Code genom hela cykeln:

- [ ] **Analysera** uppgiften
- [ ] **Planera** – ta fram en plan
- [ ] **Implementera**
- [ ] **Verifiera** – lint, typkontroll, tester och build går igenom

**Kvarvarande funktionalitet att bli klar med:**

- [x] **Uppgradera Next.js** 16.4.0 → 16.4.3 (säkerhetsfix, commit `976f47b` på `main`)
  - [x] Läs uppgraderingsguiden – samma major-version, så inga codemods behövdes
  - [x] Uppgradera `next` och `eslint-config-next` (React 19.3.0 fungerar oförändrat)
  - [x] Kör `npx next typegen`, `npm run lint`, `npx tsc --noEmit`, `npm test` och `npm run build`
  - [x] Pusha till `main` och kontrollera att produktionen fungerar
  - Varför: 16.4.0 hade tre publicerade sårbarheter, varav två kritiska (fjärrkörning av kod i `use cache`-funktioner och i bildoptimering med SVG). Appen använder `"use cache: remote"`, så den var exponerad.
- [x] **Gör sajten produktionsklar inför go-live** – se [Go-live](#-go-live-produktionsklar-möevents) nedan
- [ ] …

---

## 🔒 Go-live: produktionsklar MÖEVENTS

**Mål:** Allt som rör API:er och administration ska gå att *se* på sajten men inte *ändra*, så att ingen kan sabotera den. Ändringar görs i Vercel i stället. Backend-meddelanden som "API:et svarar inte" hör hemma i adminpanelen, och besökaren ska få en sömlös upplevelse.

### Adminpanelen blir skrivskyddad

- [x] Tog bort de tre Server Actions som vem som helst kunde anropa: slå av/på en källa, uppdatera en källas cache och uppdatera alla källor (`src/app/admin/actions.ts`)
- [x] Tog bort switcharna och uppdateringsknapparna (`src/components/admin/source-controls.tsx`)
- [x] Tog bort inställningsfilen `.data/source-settings.json` (`settings.ts`) – den fungerade ändå inte på Vercel
- [x] Källor stängs av med miljövariabeln **`EVENTS_DISABLED_SOURCES`** i Vercel, t.ex. `malmo-stad,hypnos` (`config.ts`, `isSourceEnabled` i `sources/index.ts`)
- [x] `/admin` visar varje källa som *On*, *Off in Vercel* eller *Off (demo)*, och ett kort "Changes are made in Vercel" med nuvarande värde och instruktioner. Felstavade id:n flaggas.
- [x] `/admin/sources/[id]` visar om källan syns för besökare och hur det ändras
- [x] Allt går fortfarande att se: status, felmeddelanden, varningar, svarstider, normaliserade evenemang och `/admin/logs`

### Backend-meddelanden flyttade till admin

| Tidigare för besökaren | Nu |
| ---------------------- | -- |
| Varningsruta *"Events from X are missing right now … couldn't be reached"* | Borttagen. Källan saknas bara i listan tills den är tillbaka; admin visar *Failing* och felet. |
| *"Still fetching events from X. They'll appear here by themselves."* | Neutral rad *"Loading more events…"* utan källnamn. Sidan uppdaterar sig fortfarande själv. |
| *"X is slow right now. Reload in a minute to see their events."* | Borttagen – raden försvinner tyst. |
| Källistan i sidfoten med röda/gula prickar, *"unavailable"*, *"loading…"* | Bara källor med evenemang, utan hälsostatus |
| Filtret *Listing sites* visade nere källor med 0 träffar | Visar bara källor med evenemang (`listedSources` i `pending.ts`) |
| Introt nämnde även avstängda källor | Nämner bara källor som visas |

- [x] Genomfört enligt tabellen ovan

### Så administrerar du i Vercel

| Vill du … | Gör så här |
| --------- | ---------- |
| Stänga av en källa | Settings → Environment Variables → lägg till id:t i `EVENTS_DISABLED_SOURCES` (kommaseparerat) → Redeploy |
| Slå på den igen | Ta bort id:t från variabeln → Redeploy |
| Hämta färsk data | `vercel cache invalidate --tag events` (alla källor) eller `--tag events:<id>` (en källa). En ny deploy börjar också med tom cache. |
| Se hur källorna mår | `/admin` och `/admin/logs` på sajten, eller Logs i Vercel |

### Verifiering

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (87 godkända, 5 nya) och `npm run build` går igenom
- [x] Bygget innehåller inga Server Actions för admin; ett förfalskat anrop till `/admin` ger 400
- [x] Med `EVENTS_DISABLED_SOURCES=hypnos,not-a-source`: Hypnos syns bara i admin (*Off in Vercel*), och `not-a-source` flaggas som okänt id
- [x] Med en källa som fallerar (`DEMO_SOURCE_FAILURE=true`): inga felmeddelanden på besökarsidorna, källan finns inte i filtret, och admin visar *Failing* med felet
- [x] Dokumentation uppdaterad: `README.md`, `CLAUDE.md`, `PRODUCT.md`, `docs/security-owasp.md`

### Kvar inför go-live

- [x] Committa och pusha till `main` (commit `3587b37`, live på moevents.vercel.app 2 november 2026)
- [x] Kontrollera i produktion: `/admin` har inga switchar eller knappar, och besökarsidorna inga källmeddelanden
- [ ] *(Valfritt)* Lösenordsskydda `/admin` med Vercel om även läsåtkomsten ska stängas – den visar källornas URL:er, felmeddelanden och loggar, men inga hemligheter eller besökardata
- [ ] Åtgärda kvarvarande `npm audit`-fynd: `undici` (hög, via `cheerio`, används i produktion), samt `vitest`/`tinypool` och `zod` (bara i utvecklingsverktyg)

---

## 🌍 Steg 2 – Deploya

Projektet ska vara live med en URL eller nedladdningsbart som en release vid träff 5.

### Deployment

Välj en plattform som passar din stack:

- [x] **Vercel** (frontend/fullstack)
- [ ] Railway eller Fly.io (backend)
- [ ] GitHub Releases (CLI-verktyg)
- [ ] GitHub Pages (gratis)
- [ ] Annat: …

- [ ] Projektet går att nå eller köra utan att du sitter bredvid (om det inte är ett repo som andra kan dra ner och använda)

### 💡 Tips: CI/CD-pipeline

- [ ] Sätt upp en GitHub Actions-pipeline som kör tester och deployar vid push till `main`
- [ ] Använd CI/CD-prompten från fliken **Tips** som startpunkt
- [ ] Alla känsliga värden via **GitHub Secrets** – ingenting hårdkodat

> **För MÖEVENTS:** Vercel deployar redan från `main` via Git-integrationen, så pipelinen behöver främst köra `lint`, `tsc`, `test` och `build` (med `EVENTS_LIVE=false` om källorna inte nås från CI). Deploy via Actions kräver i så fall en `VERCEL_TOKEN` som GitHub Secret.

### Verifiera

- [ ] Gör en ändring i koden
- [ ] Pusha till `main`
- [ ] Bekräfta att pipelinen kör
- [ ] Bekräfta att ändringen syns i den deployade versionen

---

## ✨ Steg 3 – Polering med agenten

- [x] Kör följande prompt mot din kodbas *(2 november 2026 – resultat i [polering.md](polering.md): 23 fynd)*

> *Gå igenom hela kodbasen systematiskt. Identifiera och lista:*
>
> 1. *Saknad felhantering för externa anrop (API-anrop, databasanrop, filläsning)*
> 2. *Otydliga felmeddelanden som inte hjälper en användare förstå vad som gick fel*
> 3. *Edge cases som inte hanteras (tomma listor, null-värden, ogiltiga indata)*
> 4. *Saknad eller otillräcklig dokumentation i komplex kod*
> 5. *Hårdkodade värden som borde vara konfigurerbara*
> 6. *… fyll på med egna preferenser*
>
> *För varje fynd: ange fil, rad och en konkret åtgärd.*

**Egna preferenser att lägga till i punkt 6 (förslag):**

- [x] Loggning som inte går via `log` i `src/lib/log.ts` eller som loggar besökarens indata *(fynd 6.3)*
- [x] Avvikelser från OWASP-reglerna i `.claude/rules/security-and-owasp.md` *(fynd 6.2)*
- [x] Tillgänglighet (WCAG 2.2) i UI-komponenterna *(fynd 6.4)*
- [x] Källadaptrar som inte rapporterar delvisa fel med `report.warn` *(fynd 6.1)*

### Resultat av granskningen

**23 fynd**, vart och ett med fil, rad, åtgärd och prioritet. Hela listan finns i [polering.md](polering.md).

| Kategori | Fynd |
| -------- | :--: |
| 1. Saknad felhantering för externa anrop | 3 |
| 2. Otydliga felmeddelanden | 6 |
| 3. Edge cases | 6 |
| 4. Dokumentation | 2 |
| 5. Hårdkodade värden | 2 |
| 6. Egna preferenser | 4 |

**Viktigast:**

- **2.2** Okända sidor, venues och dagar visar Next.js standardtext "This page could not be found" *(testat)*.
- **3.1** En sparad post utan giltigt datum kraschar hela Saved-fliken.
- **3.2 och 6.1** En källa med 0 evenemang visas som *Healthy*, och fem adaptrar hoppar tyst över rader de inte kan läsa. Gör en venue om sin sajt syns det inte i admin.
- **2.3** När "Near me" misslyckas på mobil syns ingen förklaring – den finns bara i en tooltip.
- **6.2** `undici` (via `cheerio`) har en hög sårbarhet, och säkerhetsdokumentet säger fortfarande att det inte finns några.

Fyra fynd testades genom körning mot ett lokalt produktionsbygge (2.1, 2.2, 3.5 och 6.2); resten bygger på kodläsning. **2.1 visade sig vara fel diagnos:** felet ligger i Next.js egen router, och i produktion stoppar Vercel trasiga länkar (HTTP 400) innan de når appen, så ingen ändring behövdes.

### Fynd och åtgärder

Åtgärda **minst tre** punkter från listan. **22 av 23 är åtgärdade** – status per fynd och verifiering finns i [polering.md](polering.md). De tre viktigaste:

| # | Fil | Rad | Fynd | Åtgärd | Klar |
| - | --- | --- | ---- | ------ | :--: |
| 3.1 | `src/lib/saved.ts`, `src/lib/saved-snapshot.ts` | 27 | En sparad post utan giltigt `startsAt` kraschar hela Saved-fliken | `parseSaved` kontrollerar id, titel, länk och datum innan listan visas; 3 nya tester | ✅ |
| 3.2 | `src/lib/events/fetch-source.ts` | 82 | En källa med 0 evenemang visas som *Healthy* och cachas i timmar | Varningen "No events found …" i admin, och omförsök inom 15 minuter i stället för timmar | ✅ |
| 2.2 | `src/app/not-found.tsx` (ny) | – | Okända sidor, venues och dagar visar Next.js standardtext | Egen 404-sida i samma stil som "event saknas", med vägar tillbaka till listorna | ✅ |

- [x] Minst tre fynd åtgärdade *(22 av 23; lint, typkontroll, 99 tester och build går igenom)*
- [ ] Committat

---

## 📦 Steg 4 – Paketering

### README

Skriv en komplett README med README-mallen från fliken **Tips**. Kontrollera att den täcker:

- [x] Vad projektet gör – intro med vilket problem sajten löser, live-URL och snabbstart, sedan *At a glance*, *What the site does* och *Filters*
- [x] Hur man installerar – nytt avsnitt *Installation*: `git clone`, `cd`, `npm install`, inget mer
- [x] Hur man konfigurerar – *Configuration* med exempel på `.env.local` och alla miljövariabler och inställningar i koden
- [x] Hur man kör – *Running it locally* (dev, fixtures, produktionsbygge) och nytt avsnitt *Tests and checks*
- [x] Vilka externa beroenden som krävs – nytt avsnitt *Requirements and external dependencies*: vad man installerar (Node.js ≥ 20.9, npm, Git) och vilka tjänster sajten anropar (16 källsajter, OpenFreeMap, OSM, Google Fonts vid build, Vercel)

**Så gjordes det (2 november 2026):** README:n var en lång projektrapport utan avsnitt för installation och externa beroenden. Den har nu två delar: *Getting started* (de nio första avsnitten, som täcker punkterna ovan) och *How it works* (rapporten). Den rättades också där den inte längre stämde med koden: den sa att det inte fanns något testramverk (Vitest finns), räknade 13 källor (18), nämnde Server Actions och `actions.ts` (borttagna) och beskrev kartan med vanliga OSM-tiles (nu OpenFreeMap med OSM som reserv). `/days/[day]` och `/admin/logs` saknades.

**Verifierat** med en ny klon av repot: `npm install` (4 s), `npx next typegen` + `npx tsc --noEmit`, `npm test` (87 godkända) och `EVENTS_LIVE=false npm run build` + `npm run start` (alla flikar ger 200). `tsc` fallerar på en ny klon om `typegen` inte körts först, så README:n säger det. Alla interna länkar och filsökvägar i README:n finns.

### CV-punkt

Formatet:

> *Designade och utvecklade [vad] med [teknikstack] med hjälp av agentdriven utveckling (Claude Code). Projektet [löser vilket problem] och är tillgängligt på [URL].*

Se avsnittet **"CV-mall"** i fliken **Tips** för exempel på bra och dåliga formuleringar.

- [x] Skriv CV-punkten *(utkast)*
- [ ] Jämför mot exemplen i CV-mallen

**Min CV-punkt (utkast):**

> Designade och utvecklade MÖEVENTS, en evenemangsguide för Malmö, med Next.js 16, React 19, TypeScript och Tailwind CSS på Vercel med hjälp av agentdriven utveckling (Claude Code). Projektet samlar evenemang som annars är utspridda över 16 venue- och biljettsajter, de flesta utan öppna API:er, i en gemensam lista, karta och kalender, och är tillgängligt på <https://moevents.vercel.app>.

### Repot

- [x] Publikt
- [x] README på plats *(uppdaterad 2 november 2026, inte committad än)*
- [x] Inga känsliga filer committade (kontrollera med agenten) – kontrollerat 2 november 2026:
  - Inga `.env`-filer, nycklar (`.pem`, `.key`) eller `.vercel/` är committade nu eller i historiken; `.gitignore` utesluter dem.
  - Ingen committad fil innehåller något som liknar en hemlighet (API-nycklar, tokens, lösenord, privata nycklar, GitHub-/AWS-/Vercel-tokens). Träffarna på `token` i `.agents/skills/impeccable/` är kod som bygger URL:er med en variabel, inte hemligheter.
  - `.claude/settings.local.json` är committad men innehåller bara Impeccable-hookar, inga hemligheter eller sökvägar till privata filer.
  - Projektet har inga hemligheter att läcka: ingen databas, ingen inloggning, inga API-nycklar.
- [ ] CI/CD-badge i README *(valfritt – visar pipeline-status; det finns ingen GitHub Actions-workflow än, se steg 2)*

---

## 🎤 Steg 5 – Förbered demo

Förbered en presentation på **max 3 minuter** till träff 5.

| Del | Innehåll | Tid |
| --- | -------- | --- |
| 1 | **Vad är byggt?** Visa live, inte slides | ~1:15 |
| 2 | **Hur hjälpte AI konkret?** Ge ett exempel, inte en generell beskrivning | ~1:00 |
| 3 | **Vad gör du annorlunda nästa gång?** | ~0:45 |

- [ ] Vad är byggt? – välj vad som visas live: …
- [ ] Hur hjälpte AI konkret? – mitt exempel: …
- [ ] Vad gör jag annorlunda nästa gång? – …
- [ ] Testa att live-sidan fungerar strax före demon
- [ ] Ha en reservplan om nätet eller en källa strular (t.ex. `EVENTS_LIVE=false npm run dev` lokalt)
- [ ] Öva tills den håller sig under 3 minuter

> ⏱️ **3 minuter är en hård gräns. Öva tills du klarar det.**

---


# CV punkt

Designade och utvecklade Moevents (fyndlig förkortning för Malmö events) med NextJS med hjälp av agentdriven utveckling (Claude Code). Projektet gör det enkelt för användar att hitta aktiviter i Malmö och är tillgängligt på https://moevents.vercel.app.

## 🏁 Klart till träff 5

- [ ] Kärnfunktionaliteten är klar och demonstrerbar
- [ ] Projektet är live och går att nå utan mig
- [ ] Minst tre polerings-fynd är åtgärdade och committade
- [x] README är komplett
- [X] CV-punkten är skriven
- [ ] Repot är publikt och fritt från känsliga filer
- [ ] Demon är övad och håller sig under 3 minuter
