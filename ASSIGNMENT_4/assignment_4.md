# 🚀 Hemuppgift 4: Deployment, polering och paketering

> **Introduktionskurs AI – Kimmo** · Framsteg 4 / 5 träffar · Nästa: **träff 5, demo**

| | |
| - | - |
| Live | <https://moevents.vercel.app> – Vercel, deployas automatiskt från `main` |
| Repo | <https://github.com/herrandyjohansson/Malevents> – publikt |
| Kontroller | `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` |
| Hemligheter | Inga: ingen databas, ingen inloggning, inga API-nycklar |

---

## ✅ Steg 1 – Färdigställ implementation

- [x] **Next.js 16.4.0 → 16.4.3** – säkerhetsfix för två kritiska sårbarheter, en av dem i `use cache`, som appen använder *(commit `976f47b`)*
- [x] **Produktionsklar inför go-live** – se nedan *(commit `3587b37`)*

### 🔒 Go-live

**Mål:** API:er och administration går att *se* på sajten men inte *ändra*, så ingen kan sabotera den. Backend-meddelanden hör hemma i admin, och besökaren får en sömlös upplevelse.

- **Admin är skrivskyddad.** Server Actions, switchar och uppdateringsknappar är borttagna. Allt går fortfarande att se: status, fel, varningar och loggar.
- **Källor stängs av i Vercel** med miljövariabeln `EVENTS_DISABLED_SOURCES` (kommaseparerade id:n).
- **Besökaren ser inga backend-fel.** Meddelanden som "couldn't be reached" och "slow right now" är borttagna. En källa som är nere saknas bara i listan tills den är tillbaka, och admin visar varför.

| Vill du … | Gör så här i Vercel |
| --------- | ------------------- |
| Stänga av en källa | Lägg till id:t i `EVENTS_DISABLED_SOURCES` → Redeploy |
| Slå på den igen | Ta bort id:t → Redeploy |
| Hämta färsk data | `vercel cache invalidate --tag events` (eller `events:<id>` för en källa) |

*Valfritt framöver: lösenordsskydda `/admin` i Vercel om även läsåtkomsten ska stängas.*

---

## 🌍 Steg 2 – Deploya

- [x] **Vercel**, deployas från `main` vid varje push
- [x] Projektet går att nå utan mig
- [x] Verifierat: ändring → push till `main` → Vercels bygge kör → ändringen är live efter ~40 s

*Ingen GitHub Actions-pipeline – Vercels bygge är den automatiska kontrollen (pipelinen var ett tips, inget krav).*

---

## ✨ Steg 3 – Polering med agenten

- [x] Körde granskningsprompten mot hela kodbasen: felhantering, felmeddelanden, edge cases, dokumentation och hårdkodade värden, plus egna preferenser (loggning, OWASP, tillgänglighet, `report.warn`)
- [x] **23 fynd, 22 åtgärdade** – fil, rad, åtgärd och status per fynd i [polering.md](polering.md)
- [x] Committat *(commit `59f718d`, live)* – lint, typkontroll, 99 tester och build går igenom

| # | Fynd | Åtgärd |
| - | ---- | ------ |
| 3.1 | En sparad post utan giltigt datum kraschade hela Saved-fliken | `parseSaved` filtrerar bort ogiltiga poster; nya tester |
| 3.2 | En källa med 0 evenemang visades som *Healthy* och cachades i timmar | Varning i admin och nytt försök inom 15 minuter |
| 2.2 | Okända sidor visade Next.js standardtext | Egen 404-sida med vägar tillbaka till listorna |

*Fynd 2.1 (trasig länk ger 500) var fel diagnos: felet ligger i Next.js router, och Vercel stoppar sådana länkar innan de når appen.*

---

## 📦 Steg 4 – Paketering

- [x] **README** täcker vad projektet gör, installation, konfiguration, körning och externa beroenden *(commit `59f718d`)*
- [x] **Repot** är publikt, och inga känsliga filer är committade, varken nu eller i historiken
- [x] **CV-punkt:**

> Designade och utvecklade MÖEVENTS (en fyndig förkortning för Malmö events) med Next.js med hjälp av agentdriven utveckling (Claude Code). Projektet gör det enkelt för användare att hitta aktiviteter i Malmö och är tillgängligt på <https://moevents.vercel.app>.

---

## 🎤 Steg 5 – Förbered demo

Max **3 minuter**: vad som är byggt (live), hur AI hjälpte (ett konkret exempel) och vad jag gör annorlunda nästa gång. Manus finns i [demo.md](demo.md).

---

## 🏁 Klart till träff 5

- [x] Kärnfunktionaliteten är klar och demonstrerbar
- [x] Projektet är live och går att nå utan mig
- [x] Minst tre polerings-fynd är åtgärdade och committade
- [x] README är komplett
- [x] CV-punkten är skriven
- [x] Repot är publikt och fritt från känsliga filer
- [ ] Demon är övad och håller sig under 3 minuter
