### 📄 Leverabel


# Problemet du analyserade
Det började med att jag märkte att Malmo stad API web scrape inte fungerade. Så här gjorde ett val att analysera och fixa det utifrån loggarna. Det jag gjorde var att jag installerade ett en skill från Vercel officella dokumentation för att hämta och hantera loggarna. Sparade dessa loggarna till en markdown fil som heter `malmo-stad-prod-logs-cli.md`. 

# Hur du beskrev det för agenten (vad gav du för kontext?)

Utifrån en ny session gjorde jag en prompt utifrån principen 4D. Det vill säga jag delegerade åt sessionen att utföra en analys med en beskrivning: analysera felen och ge mig tre hypoteser om orsak i ordning av sannolikhet i detalj. Avsluta med konkretiserade åtgärder.

# Agentens hypoteser

1. **Cachade fel triggar en uppdatering i bakgrunden som fryses.** `cacheLife("seconds")` ger `revalidate` 1 s och `expire` 60 s, så ett gammalt fel serveras direkt medan Next hämtar om i bakgrunden. Den hämtningen hålls inte vid liv på Vercel. Instansen fryses, och när den tinar vid nästa request löser timern ut och ett nytt, falskt `timeout`-fel cachas. Felet förlänger sig självt.
   *Verifiering:* dra av varaktigheten från loggtiden för varje `timeout`-rad. Alla tre starttider (10:21:37.978, 10:26:33.559, 10:37:21.036) ligger inom några millisekunder från en `source.unavailable` som serverade ett cachat fel.
2. **malmo.se svarar inte från Vercels region arn1.** Det kan vara driftstörning, rate limiting eller blockering. Felet går inte att bekräfta, eftersom koden loggade bara "fetch failed" och slängde den underliggande orsaken (`err.cause`).
   *Verifiering:* kör `curl -v` mot URL:en från arn1 och logga felkoden.
3. **Kall cache efter deploy.** Kl. 10:07 stod 6 källor som `pending`. Det fanns ingen tidigare lyckad kopia att falla tillbaka på, så ett tillfälligt fel slog igenom fullt ut.

# Vilken hypotes du valde och varför
Jag valde nummer 1 vilket kändes mer rimligt att detta var ett lokalt fel inom applikationen istället för till exempel nr 2, att malmo.se inte svarar på anrop från Vercel. Vilket på något sätt att då hade detta uppmärksammats tidigare i något hänseende. Så en hel del av valet gjordes av tidigare erfarenheter av utveckling.

Jag kollade sen mer noggrant på `fetch-source.ts` och såg att misslyckade hämtningar cachades med `cacheLife("seconds")`. Och jag vet sen innan från dokumentationen att ett fel då ligger kvar och visas i upp till 60 sek medan en ny hämtning sker i bakgrunden. Det stämde ju med loggarna och gjorde mig rätt säker på hypotes 1.

# Vad som faktiskt var fel
Kors i taket, det var inget fel med Malmo web scrape eller API. Det var något tillfälligt avbrott. Däremot så uppmärksammades att felet cachades. Varje fel låg bara kvar en kort stund, men varje nytt försök att hämta datan misslyckades eller frystes i bakgrunden och sparade ett nytt fel. Så avbrottet kanske bara var för ett ögonblick, men felet förnyade sig självt och gjorde att Malmö stad-källan var borta från sidan i ca 30 min, medan resten av källorna fungerade som vanligt. Detta skulle jag säga var helt klart oavsiktligt och på sätt och vis en bugg.


# Vad agenten fick rätt och vad den missade
Agenten fick ju helt rätt här, problemet låg inte hos någon slags web scrape mot Malmö Stad webbplatsen utan det var ju bara att tjänsten var otillgänglig för ett ögonblick, och efter det fastnade appen i att spara nya fel i ca 30 min trots att den försökte hämta om. Den tog ju hänsyn till NextJS dokumentation och fann ut att `cacheLife` kunde vara problemet i detta fallet.

Vad den missade eller begränsningar i analysen som inte fastställdes: är det vanligt att Malmö Stad misslyckas att hämta data? För vidare analys hade jag tryckt på om det kan vara någon rate limit eller något annat vid min applikation som kan vara orsaken till varför det funkar till och från. Sen är det värt att säga att agentens förklaring om att Vercel fryser hämtningen i bakgrunden bygger på tidsstämplarna i loggarna och inte på dokumentation, och fixen är inte testad i produktion än.