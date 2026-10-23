Gin är ett webbramverk för HTTP i Go. Det lägger sig ovanpå standardbibliotekets `net/http` och gör tre saker smidigare: att koppla URL:er till kod (routing), att köra gemensam kod före och efter varje anrop (middleware), och att läsa in och skicka tillbaka data som JSON, XML och liknande. Det är byggt för att vara snabbt och allokera lite minne.

## Hur det används

```go
r := gin.Default()                       // Engine med Logger + Recovery
r.GET("/users/:id", func(c *gin.Context) {
    c.JSON(200, gin.H{"id": c.Param("id")})
})
api := r.Group("/api", authMiddleware)   // grupp med egen middleware
api.POST("/items", createItem)
r.Run(":8080")
```

## Byggstenarna

| Fil / mapp | Vad den gör |
|---|---|
| [gin.go](gin.go) | `Engine`, själva servern. Innehåller ett routing-träd per HTTP-metod, en pool av `Context`-objekt och inställningar. Den implementerar `http.Handler` |
| [routergroup.go](routergroup.go) | `RouterGroup`, som står för `GET`/`POST`/`Group`/`Use`. `Engine` *är* själv rotgruppen |
| [tree.go](tree.go) | Routern. Ett **radix-träd** (komprimerat prefixträd), ursprungligen från httprouter |
| [context.go](context.go) | `Context`, som följer med ett anrop genom hela kedjan. Där finns params, bindning, svar, `Next`/`Abort` och `Keys` |
| [binding/](binding/) | Läser in request-data i structs: JSON, form, query, URI, header, XML, YAML, TOML, protobuf, msgpack, BSON. Validerar med `go-playground/validator` |
| [render/](render/) | Skriver svaret: JSON (flera varianter), HTML-mallar, XML, YAML, protobuf, redirect, filer och strömmar |
| [codec/json/](codec/json/) | JSON-motorn väljs med en build-tag: standard `encoding/json` eller `jsoniter`, `go_json` eller `sonic` |
| [logger.go](logger.go), [recovery.go](recovery.go) | Middleware som följer med i `Default()`: loggning av anrop, och fångst av panics som blir ett 500-svar |

## Ett anrops väg genom ramverket

1. **`ServeHTTP`** ([gin.go:691](gin.go#L691)) hämtar en `Context` från en `sync.Pool` i stället för att skapa en ny, och nollställer den. Det sparar minne vid hög last. När anropet är klart läggs objektet tillbaka i poolen.
2. **`handleHTTPRequest`** ([gin.go:719](gin.go#L719)) väljer trädet för rätt HTTP-metod och slår upp sökvägen med `root.getValue(...)`. Uppslaget returnerar handler-kedjan och path-parametrarna, till exempel `:id`.
3. Om ingen route matchar:
   - Ramverket försöker först omdirigera, antingen med eller utan avslutande snedstreck eller till en rättad sökväg.
   - Därefter blir det **405** med en `Allow`-header om sökvägen finns för en annan metod.
   - Annars blir det **404**.
4. Om en route matchar sätts `c.handlers` och sedan anropas **`c.Next()`**.

## Middleware-kedjan, det centrala tricket

När en route registreras slår `combineHandlers` ([routergroup.go](routergroup.go)) ihop gruppens middleware med route-handlern till **en enda platt lista**, `HandlersChain`. Hela kedjan byggs alltså när routen registreras, inte när anropet kommer in.

```go
func (c *Context) Next() {          // context.go:197
    c.index++
    for c.index < len(c.handlers) {
        c.handlers[c.index](c)
        c.index++
    }
}
```

- En middleware som anropar `c.Next()` mitt i sig själv kör resten av kedjan och får sedan kontrollen tillbaka. Det ger "före/efter"-beteende, som när loggern mäter svarstid.
- **`c.Abort()`** sätter bara `index` till `abortIndex` (63), så att loopen slutar. Det betyder också att en kedja får ha högst 63 handlers, vilket kontrolleras med en assert.

## Routern (radix-trädet)

[tree.go](tree.go) har fyra typer av noder:
- `static`: vanlig text i sökvägen
- `root`: trädets rot
- `param`: `:name`, som matchar ett segment
- `catchAll`: `*path`, som matchar resten av sökvägen

Gemensamma prefix delas mellan noder, så ett uppslag tar ungefär lika lång tid som sökvägen är lång, oberoende av hur många routes som finns. Uppslaget skapar heller inga nya objekt i minnet. Det är huvudskälet till att Gin är snabbt.

Trädet kan också backa via `skippedNodes`. Därför kan till exempel `/users/new` (statisk) och `/users/:id` (parameter) finnas samtidigt.

## In- och utdata

- **In:** `c.ShouldBindJSON(&obj)` och `c.ShouldBind(&obj)`, där den senare väljer binder utifrån `Content-Type`. Fälten styrs av struct-taggar som `json:"..."`, `form:"..."` och `binding:"required"`. `Bind*`-varianterna avbryter dessutom med 400 om något fel uppstår.
- **Ut:** `c.JSON`, `c.XML`, `c.HTML`, `c.String`, `c.File`, `c.Stream` och så vidare. Alla använder en `render.Render`-implementation som sätter `Content-Type` och skriver ut svaret.

## Övrigt värt att veta

- **`gin.New()` jämfört med `gin.Default()`:** `Default` lägger till Logger och Recovery.
- **Lägen:** debug, release och test, via `GIN_MODE`. I debug-läge skrivs varje route ut när den registreras.
- **`c.Copy()`** måste användas om `Context` ska skickas vidare till en goroutine, eftersom objektet återanvänds via poolen. En nyligen gjord fix i repot, `1bd0ecf2`, gäller just detta.
- [ginS/](ginS/) är en variant med en global singleton-`Engine`. [internal/](internal/) innehåller hjälpkod för konvertering mellan bytes och strängar utan kopiering, samt för filsystem.
- Det mesta av koden är tester: [context_test.go](context_test.go) har ensam drygt 4000 rader. Testerna körs med `make test`.

**Kort sagt:** Gin är ett tunt lager ovanpå `net/http`. Det består av ett snabbt radix-träd för routing, en återanvänd `Context` som skickas genom en färdigbyggd lista av handlers (`Next`/`Abort`), och verktyg för att läsa in och skriva ut data.
