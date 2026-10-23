1. Tillät Claude för Vercel loggningar
2. Hittade i Logs att Malmö stad web scrape funkar inte
3. Hämtar loggarna från PROD
4. Hittar en skill på `https://mcpservers.org/agent-skills/vercel/logs` o installerar
5. Hämtar nya loggar med nya skill installerad från vercle
6. Malmö stad började funka igen, något tillfälligt fel? Det är inte så mycket trafik på sidan, verkar vara svårt att hitta någon bugg

7. Gör en ändå en analyis prompt på `malmo-stad-prod-logs.md`
8. Claude parsar loggarna med `jq`, läser `http.ts`, `fetch-source.ts`, `aggregate.ts`, `malmo-stad.ts` och Next-dokumentationen för `cacheLife`
9. Hittar avvikelse: timeout-fel på 65–203 s trots 15 s gräns. Starttiderna matchar på millisekunden ett cachat fel → hypotes 1 (felcachen)
10. Claude fixar `fetch-source.ts` (`FAILURE_LIFETIME`) och `http.ts` (loggar felorsaken). Lint, typkontroll och build ok, inte testat i prod
11. Dokumenterar i `ANALYS_RESULTAT.md` (kursens upplägg) och `ANALYS_RADATA.md` (rådata från analysen)
12. Skriver `LEVERABEL.md` själv, låter Claude granska mot checklistan två gånger
13. Upptäcker att jag verifierat mot fixen (`FAILURE_LIFETIME`) och inte mot buggen (`cacheLife("seconds")`), rättar
14. Rättar missförstånd: felet låg inte cachat i 30 min, det förnyades vid varje misslyckat försök. Bara Malmö stad-källan saknades, inte hela sidan
15. Claude justerar texten i `LEVERABEL.md` efter min skrivstil

Problemet: När malmo.se inte svarade sparades felet i cachen och fortsatte att visas, samtidigt som en ny hämtning startades i bakgrunden. Vercel frös den hämtningen. När den vaknade igen räknades den som en timeout och sparade ett nytt fel. Så höll det på i cirka 30 minuter, och under tiden saknades Malmö stads events på sidan.

Fixen: Ett fel visas inte längre medan en ny hämtning körs i bakgrunden. Efter 15 sekunder hämtar nästa besök om direkt. Dessutom loggas nu den riktiga orsaken till nätverksfel, inte bara "fetch failed".