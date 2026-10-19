# Del A

# 0
Vid undersöknings så hittade jag en skill set som heter "Acquire Codebase Knowledge". Länk: https://awesome-copilot.github.com/skill/acquire-codebase-knowledge

I planeringsläget ber jag den gå igenom kodbasen och lägga fokus på läsbarhet, logik och annan teknisk skuld som kan vara relevant att åtgärda.

# 1 Vad identifierade agenten?
Agenten upptäckte en hel del refactoring förbättringar. Till exempel vill den göra förbättringar i form av flytta funktioner till andra ställen för att kunna återanvändas flitigare. Den ville även ändra en hel del namn för att förtydliga deras roll i applikationen. Detta gällde genomgående i applikationen, allt från date-utils, types och scrape funktionern.

# 2 Vad ville agenten göra som du stoppade och varför?
I planen justerade jag bort lite saker som jag tyckte var irrelevant, ofta byta namn eller ställe på några funktioner. 

# 3 Vad missade den?
Jag kände att den missade en ny hantering för laddtiden. Det tar ett tag att ladda in alla API källorna och i dagsläget så inväntas det på alla källor innan det börjar renderas ut. Detta är ju en slags teknisk skuld som skulle bli ett riktigt problem senare om det hade funnit fler ännu fler datorkällor. 

# 4 Är projektet körbart efter implementationen?

Ja

---

# Del B – Granskning ur tre perspektiv

## Uppgift

Be Claude Code granska kodbasen utifrån tre perspektiv. Kör var och en som en separat prompt, men försök iterera inom det isolerade området för att minimera hallucinationer och förbättra granskningen.

- [ ] **Prompt 1 – Arkitektur:**
	> Granska kodbasen mot de arkitekturprinciper jag definierat i CLAUDE.md. Var bryter koden mot principerna? Var är den i linje med dem? Ge konkreta filreferenser.
- [ ] **Prompt 2 – Säkerhet:**
	> Gå igenom kodbasen och leta efter: hårdkodade hemligheter eller uppgifter, saknad inputvalidering, injection-risker (SQL, kommando, path traversal), känsliga data i loggar, och osäkra standardvärden. Lista varje fynd med filnamn och radnummer.´
- [ ] **Prompt 3 – Kodkvalitet:**
	> Identifiera: funktioner som gör mer än en sak, otydlig namngivning (variabler, funktioner, klasser), saknad felhantering för externa anrop, och kod som är svår att läsa utan kommentarer. Lista de fem allvarligaste problemen.

## Leverabel

Dokumentera vad agenten hittade i varje kategori. Om det är din egen kodbas, åtgärda minst en punkt från varje kategori och committa ändringarna. Dokumentationen kan ligga i commiten till förändringen.

- [ ] Dokumentera fynden: arkitektur
- [ ] Dokumentera fynden: säkerhet
- [ ] Dokumentera fynden: kodkvalitet
- [ ] Åtgärda minst en punkt per kategori och committa

## 1 Arkitektur – fynd
Åtta principer som efterföljs från `CLAUDE.md` filen

Sex principer som inte följer.

Det är några ställen där cache principerna som inte helt efterföljs men det som är mest intressant är precis som jag nämnde i A delen "vad missade den". Såhär ser den punkten ut:
`Den långsammaste källan blockerar allt. aggregate.ts:77 väntar med Promise.all på alla källor. Sidan streamar först när den långsammaste källan är klar eller har nått sin timeout på upp till 8 s. Streamingprincipen följs alltså per sida men inte per källa. Det är samma problem som du noterade i Del A §3.`. 

Precis som jag nämnde att jag tyckte att det var något som jag förväntade bör dykt upp i den första planen och implementeringen. Utöver detta så hittade kod som inte längre nyttjas och att viss formatering av kod som inte efterföljs helt och hållet.


## 2 Säkerhet – fynd
Den korrekt identifierade att admin-funktion är helt öppen, vilket jag medvetet val från min sida under utveckling.

Cachen är öppen för vem som helst att tömma genom att anrop.

`source.settings.json` som kan vem som helst skriva till, vilket också är ett bra fynd ur ett säkerhetsperspektiv.

Utöver detta fann den att några https filer inte korrekt kontrolleras samt vid scrape så kontrolleras inte datan tillräckligt mycket vilket lämnar rum för säkerhetsbrister.


## 3 Kodkvalitet – fynd

"Moriska" anropet kan förbättras och har en brist i sin loopning.

Tickster har en brist i hantering om tiden inte kan fastställas.

Blandad logik och rendering på Tonight-sidan som den föreslår att refaktorera.

Den föreslår att göra fokusera på göra en mer enhetlig namnstandard för projektet för att öka läsbarheten i projektet.

## 4 Åtgärder och commits

# Del B

