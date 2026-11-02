# 🎤 Demo – MÖEVENTS (max 3:00)

| Del | Innehåll | Tid | Klockan visar |
| --- | -------- | --- | ------------- |
| 1 | Vad är byggt? – visa live | 1:15 | 0:00 → 1:15 |
| 2 | Hur hjälpte AI konkret? – ett exempel | 1:00 | 1:15 → 2:15 |
| 3 | Vad gör jag annorlunda nästa gång? | 0:45 | 2:15 → 3:00 |

**Tecken på att du ligger efter:** vid 1:15 ska du ha visat Admin, och vid 2:15 ska du säga "Tre saker gör jag annorlunda".

---

## 1. Vad är byggt? *(1:15)*

**Stödord:** EVENTSIDA för Malmö, Byggt i NextJS, deployad med Vercel, 18 sajter · 1 500 events just nu

**▶ Tonight**
> "Tonight visar vad som händer i kväll, i tidsordning. I dagsremsan kan jag bläddra till i morgon."

**▶ Discover** – välj Möllan och Gratis
> "I Discover filtrerar jag, till exempel på Möllan och gratis. Filtren hamnar i länken, så jag kan skicka listan till en kompis." *(Om du hinner: byt till kalendervyn.)*

**▶ Map** – tryck på en nål
> "Kartan visar var det händer."

**▶ Ett evenemang → hjärtat → Saved**
> "Jag sparar med hjärtat – inget konto behövs – och lägger in det i min egen kalender."

**▶ Admin**
> "Här ser jag om källorna fungerar. Är en sajt nere märker besökaren ingenting. Adminvyn går bara att titta på – allt ändras i Vercel, så ingen kan sabotera sajten."

---

## 2. Hur hjälpte AI konkret? *(1:00)*

**Stödord:** tekniken själv · inget API · skill · OpenWeb · robots.txt · lista · jag väljer · fem källor

> "Tekniken valde jag själv. Där AI:n verkligen gjorde skillnad var att **hitta källorna**."

> "Problemet: de flesta venues visar sina evenemang på sin sajt, men har inget öppet API."

> "Så jag lät Claude Code skriva en **skill** – en återanvändbar instruktion – som heter **find-malmo-event-source**. Den gör fyra saker:"

1. "Letar upp venues som saknas."
2. "Spelar in vad sidan laddar med verktyget **OpenWeb** och hittar datan bakom."
3. "Kollar att en server får läsa den – utan nyckel eller inloggning, och vad **robots.txt** säger."
4. "Skriver ner allt i en lista. Sen **stannar den och låter mig välja**."

> "Första körningen gav **fem nya källor**: Spegeln, Panora, Medley, Malmö Arena och Hypnos. Hos Plan B och Panora hittade den dataflöden som inte syns på sidan."

---

## 3. Vad gör jag annorlunda nästa gång? *(0:45)*

**Stödord:** kontext · skills först · vad den inte ska göra

> "Tre saker gör jag annorlunda."

> "**Ett:** mer kontext från början – inspiration och källor – innan första raden kod."

> "**Två:** skills och instruktioner först. Källskillen kom efter två och en halv vecka, och det var den som gav mest. Nästa gång skriver jag den första veckan."

> "**Tre:** jag säger tidigt vad projektet *inte* ska göra. Annars bygger agenten gärna mer än jag behöver."

> "Tack!"

---

## ⏱️ Om du ligger efter

- **Del 1:** hoppa över kalendervyn och nålen på kartan – visa bara kartan.
- **Del 2:** säg "fem nya källor" utan att räkna upp namnen.
- **Del 3:** hoppa över "Ett" och börja på "Två".

---

## ❓ Om någon frågar

| Fråga | Svar |
| ----- | ---- |
| Är det okej att skrapa sajterna? | "Bara publika sidor. Robots.txt kollas, botten säger vem den är, och allt cachas så sajterna anropas sällan. Biljetterna köps hos arrangören – jag länkar ut." |
| Vad händer om en källa går ner? | "Resten funkar som vanligt. Den källan saknas en stund, och i admin ser jag felet." |
| Kostar det något? | "Nej. Vercel, kartan och alla källor är gratis – inga nycklar, ingen databas." |
| Hur vet du att AI:ns kod är rätt? | "Lint, typkontroll, tester och build före varje push. Agenten följer säkerhetsregler, och jag granskar ändringarna." |
| Samma evenemang från flera sajter? | "De slås ihop. En granskning tog dubbletterna från 44 till 3." |
| Är den säker utan inloggning? | "Admin går bara att titta på, och ändringar görs i Vercel. AI:n hittade också en kritisk säkerhetslucka i Next.js som jag uppgraderade bort före go-live." |
| Vilken teknik? | "Next.js och React med TypeScript, på Vercel. Kartan är Leaflet med gratis kartbilder." |

---

## ✅ Innan demon

- [ ] Öppna <https://moevents.vercel.app> 5 minuter innan, så att sidorna laddar snabbt
- [ ] Kolla antalet evenemang i `/admin` och uppdatera "1 500" ovan
- [ ] Slå på Admin mode i webbläsaren du visar från
- [ ] Zooma upp webbläsaren så det syns på projektorn
- [ ] Reservplan om nätet strular: `EVENTS_LIVE=false npm run dev` lokalt
- [ ] Ta tid på en genomkörning högt – under 3:00
