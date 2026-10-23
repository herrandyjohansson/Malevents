# 🐛 Hemuppgift 3: Felsökning och feature-implementation

> **Introduktionskurs AI – Kimmo**
> Introduktionskurs till utveckling med AI-stöd

---

## 📅 Kursöversikt

**Framsteg:** 2 / 5 träffar

| Status | Träff | Datum | Tid |
| :----: | ----- | ----- | --- |
| ✅ | Träff 1 – Systemförståelse | 6 oktober 2026 | 17:00–18:00 |
| ✅ | Träff 2 – Lös din första uppgift | 13 oktober 2026 | 17:00–18:00 |
| ▶️ | **Träff 3 – Felsökning** *(nästa)* | 20 oktober 2026 | 17:00–18:00 |
| 🔒 | Träff 4 – Leverans och driftsättning | – | – |
| 🔒 | Träff 5 – Avslutning | – | – |

---

## 🔍 Del A – Felsökningsövning

Den här uppgiften är byggd kring **The 4Ds**: du **delegerar** analysen, **beskriver** problemet rätt, **bedömer** svaret kritiskt och **äger** resultatet. Du behöver inte tänka på dem aktivt – men du kommer märka dem när du är klar.

### 🎯 Uppgift

Analysera ett riktigt problem med Claude Code. Välj **ett** av följande:

- [ ] En bugg du stött på i ditt eget projekt under kursen
- [ ] En bugg från ett open source-projekts issue-tracker (sök på etiketten `bug` eller `confirmed bug`)
- [ ] Ett fel du kan simulera, till exempel:
  - ett API som returnerar oväntat svar
  - en edge case i indata som kraschar en funktion
  - ett prestandaproblem du ser i loggar

---

### 🛠️ Genomförande

Ge agenten materialet (stack trace, loggar, buggbeskrivning) och ställ frågorna nedan i **separata steg**.

#### Steg 1 – Delegation & Description: Ge agenten rätt material

Innan du klistrar in loggar eller stack trace – formulera kontexten. Ju bättre du beskriver, desto mer användbart svar.

- [ ] Vad hände?
- [ ] När hände det?
- [ ] Vad hade ändrats?
- [ ] Bifoga stack trace, loggar eller buggbeskrivning
- [ ] Skicka prompten:

> *Analysera det här felet och formulera tre hypoteser om rotorsaken, ordnade efter sannolikhet. För varje hypotes: förklara mekanismen och ange konkreta verifieringssteg.*

#### Steg 2 – Discernment: Välj och undersök rätt hypotes

Agenten ger dig tre alternativ. Välj det som känns mest troligt utifrån **din** kunskap om systemet – inte bara det agenten sätter som nummer ett.

- [ ] Läs igenom alla tre hypoteserna
- [ ] Välj den mest sannolika utifrån din egen systemkunskap
- [ ] Skicka prompten:

> *Utifrån hypotes [välj den mest sannolika]: vilka filer och funktioner ska jag undersöka? Vad ska jag leta efter?*

- [ ] Undersök filerna och funktionerna agenten pekar ut

#### Steg 3 – Diligence: Utvärdera och dokumentera

Det här steget är där lärandet sker.

- [ ] Var agentens hypoteser korrekta?
- [ ] Vad var vilseledande?
- [ ] Skriv dokumentationen (se leverabel nedan)

---

### 📄 Leverabel

En kort dokumentation (fritext, **max en sida**) som täcker:

- [ ] Problemet du analyserade
- [ ] Hur du beskrev det för agenten (vad gav du för kontext?)
- [ ] Agentens hypoteser
- [ ] Vilken hypotes du valde och varför
- [ ] Vad som faktiskt var fel
- [ ] Vad agenten fick rätt och vad den missade

---

### 💡 Varför den här uppgiften

Felsökning är det konsultscenario där AI ger mest omedelbart värde. Att formulera och verifiera hypoteser snabbare sparar timmar. Det är en metod du kan använda redan i morgon, på vilken kodbas som helst, utan att mata kundens kod genom en extern tjänst.

> **Analysen sker i ditt huvud – agenten hjälper dig tänka.**
