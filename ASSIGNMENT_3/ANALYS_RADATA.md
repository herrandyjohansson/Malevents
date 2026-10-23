# Analys – rådata

Källa: `malmo-stad-prod-logs-cli.md` (Vercel, production, deployment `dpl_CjiGjrK2jo57QUQfrLgqVL5CDEhH`, region `arn1`, runtime `nodejs24.x`), 2026-10-23 10:07:33–10:43:04 UTC. 74 loggrader.

## 1. Varningar och hämtningar för malmo-stad

Extraherat med `jq` ur `.data.message`. Kolumner: tid (UTC), sökväg, event, orsak, durationMs, fel/resultat.

```text
2026-10-23T10:07:41.879Z	/	http.failed	network	10852	[malmo-stad] fetch failed
2026-10-23T10:07:41.880Z	/	source.fetch_failed	network	10853	[malmo-stad] fetch failed
2026-10-23T10:20:49.849Z	/	http.failed	network	10344	[malmo-stad] fetch failed
2026-10-23T10:20:49.849Z	/	source.fetch_failed	network	10345	[malmo-stad] fetch failed
2026-10-23T10:20:49.850Z	/admin	source.unavailable	-	3968	[malmo-stad] fetch failed
2026-10-23T10:20:49.850Z	/venues	source.unavailable	-	2676	[malmo-stad] fetch failed
2026-10-23T10:20:51.595Z	/venues	source.unavailable	-	44	[malmo-stad] fetch failed
2026-10-23T10:20:52.753Z	/	source.unavailable	-	100	[malmo-stad] fetch failed
2026-10-23T10:21:37.982Z	/venues	source.unavailable	-	122	[malmo-stad] fetch failed
2026-10-23T10:21:38.585Z	/admin	source.unavailable	-	8	[malmo-stad] fetch failed
2026-10-23T10:25:01.245Z	/	http.failed	timeout	203267	[malmo-stad] No response from malmo.se within 15000 ms
2026-10-23T10:25:01.245Z	/	source.fetch_failed	timeout	203267	[malmo-stad] No response from malmo.se within 15000 ms
2026-10-23T10:25:11.723Z	/	http.failed	network	10127	[malmo-stad] fetch failed
2026-10-23T10:25:11.723Z	/	source.fetch_failed	network	10127	[malmo-stad] fetch failed
2026-10-23T10:26:23.068Z	/	http.failed	network	10293	[malmo-stad] fetch failed
2026-10-23T10:26:23.068Z	/	source.fetch_failed	network	10293	[malmo-stad] fetch failed
2026-10-23T10:26:23.069Z	/admin	source.unavailable	-	3542	[malmo-stad] fetch failed
2026-10-23T10:26:33.561Z	/admin	source.unavailable	-	41	[malmo-stad] fetch failed
2026-10-23T10:27:38.843Z	/venues	http.failed	timeout	65284	[malmo-stad] No response from malmo.se within 15000 ms
2026-10-23T10:27:38.843Z	/venues	source.fetch_failed	timeout	65284	[malmo-stad] No response from malmo.se within 15000 ms
2026-10-23T10:27:49.324Z	/venues	http.failed	network	10214	[malmo-stad] fetch failed
2026-10-23T10:27:49.324Z	/venues	source.fetch_failed	network	10214	[malmo-stad] fetch failed
2026-10-23T10:27:49.325Z	/admin	source.unavailable	-	9225	[malmo-stad] fetch failed
2026-10-23T10:37:19.971Z	/	http.failed	network	10847	[malmo-stad] fetch failed
2026-10-23T10:37:19.971Z	/	source.fetch_failed	network	10848	[malmo-stad] fetch failed
2026-10-23T10:37:21.039Z	/venues	source.unavailable	-	30	[malmo-stad] fetch failed
2026-10-23T10:38:30.747Z	/admin	http.failed	timeout	69711	[malmo-stad] No response from malmo.se within 15000 ms
2026-10-23T10:38:30.747Z	/admin	source.fetch_failed	timeout	69711	[malmo-stad] No response from malmo.se within 15000 ms
2026-10-23T10:38:37.041Z	/admin	source.fetched	-	6032	events=289
2026-10-23T10:38:38.334Z	/admin	source.fetched	-	6203	events=289
```

## 2. `events.loaded` per request, kolumner för malmo-stad

Kolumner: tid, total durationMs, ok, failed, pending, malmo-stad state, ms, cache, ageS, count.

```text
2026-10-23T10:07:33.830Z	3101	5	0	6	pending	3001	-	-	0
2026-10-23T10:20:42.283Z	3019	10	0	1	pending	3001	-	-	0
2026-10-23T10:20:47.783Z	3008	10	0	1	pending	3001	-	-	0
2026-10-23T10:20:49.856Z	3975	10	1	0	error	3968	-	-	0
2026-10-23T10:20:49.863Z	2690	10	1	0	error	2676	-	-	0
2026-10-23T10:20:51.661Z	111	10	1	0	error	44	-	-	0
2026-10-23T10:20:52.867Z	229	10	1	0	error	100	-	-	0
2026-10-23T10:21:38.174Z	319	10	1	0	error	122	-	-	0
2026-10-23T10:21:38.642Z	68	10	1	0	error	8	-	-	0
2026-10-23T10:25:04.444Z	3084	10	0	1	pending	3001	-	-	0
2026-10-23T10:25:05.515Z	3006	10	0	1	pending	3000	-	-	0
2026-10-23T10:26:15.618Z	3006	10	0	1	pending	3000	-	-	0
2026-10-23T10:26:20.741Z	3007	10	0	1	pending	3000	-	-	0
2026-10-23T10:26:23.074Z	3549	10	1	0	error	3542	-	-	0
2026-10-23T10:26:37.581Z	4064	10	1	0	error	41	-	-	0
2026-10-23T10:27:41.916Z	3044	10	0	1	pending	3001	-	-	0
2026-10-23T10:27:49.332Z	9233	10	1	0	error	9225	-	-	0
2026-10-23T10:37:12.043Z	3105	10	0	1	pending	3075	-	-	0
2026-10-23T10:37:21.137Z	130	10	1	0	error	30	-	-	0
2026-10-23T10:38:37.059Z	6169	11	0	0	ok	6158	miss	0	289
2026-10-23T10:38:38.367Z	6423	11	0	0	ok	6404	miss	0	289
2026-10-23T10:41:30.408Z	475	11	0	0	ok	436	hit	172	289
2026-10-23T10:41:31.653Z	80	11	0	0	ok	49	hit	173	289
2026-10-23T10:41:33.749Z	114	11	0	0	ok	41	hit	175	289
2026-10-23T10:41:35.329Z	66	11	0	0	ok	47	hit	177	289
2026-10-23T10:41:37.962Z	92	11	0	0	ok	51	hit	180	289
2026-10-23T10:41:57.925Z	198	11	0	0	ok	162	hit	200	289
2026-10-23T10:41:59.165Z	78	11	0	0	ok	54	hit	201	289
2026-10-23T10:42:03.344Z	141	11	0	0	ok	111	hit	205	289
2026-10-23T10:42:16.267Z	171	11	0	0	ok	98	hit	218	289
2026-10-23T10:42:16.930Z	81	11	0	0	ok	36	hit	219	289
2026-10-23T10:42:21.865Z	121	11	0	0	ok	80	hit	224	289
2026-10-23T10:42:32.092Z	120	11	0	0	ok	73	hit	234	289
2026-10-23T10:42:32.371Z	62	11	0	0	ok	37	hit	234	289
2026-10-23T10:42:38.032Z	111	11	0	0	ok	63	hit	240	289
2026-10-23T10:42:39.322Z	74	11	0	0	ok	53	hit	241	289
2026-10-23T10:42:40.092Z	59	11	0	0	ok	30	hit	242	289
2026-10-23T10:42:40.810Z	64	11	0	0	ok	41	hit	242	289
2026-10-23T10:42:55.803Z	276	11	0	0	ok	221	hit	257	289
2026-10-23T10:43:02.203Z	109	11	0	0	ok	78	hit	264	289
2026-10-23T10:43:03.322Z	75	11	0	0	ok	60	hit	265	289
2026-10-23T10:43:04.009Z	61	11	0	0	ok	22	hit	266	289
2026-10-23T10:43:04.987Z	96	11	0	0	ok	65	hit	267	289
```

## 3. Beräknade starttider för `timeout`-felen

Loggtid minus durationMs. Matchas mot närmaste rad i tabell 1.

```text
10:25:01.245 - 203267 ms = 10:21:37.978   ↔ 10:21:37.982 /venues source.unavailable (122 ms)
10:27:38.843 -  65284 ms = 10:26:33.559   ↔ 10:26:33.561 /admin  source.unavailable (41 ms)
10:38:30.747 -  69711 ms = 10:37:21.036   ↔ 10:37:21.039 /venues source.unavailable (30 ms)
```

## 4. Observationer

- `network`-fel: 6 st (varje loggas både som `http.failed` och `source.fetch_failed`), durationMs 10 127–10 853. Felmeddelandet var alltid `[malmo-stad] fetch failed`, utan orsak.
- `timeout`-fel: 3 st, durationMs 65 284–203 267. Konfigurerad timeout: 15 000 ms (`AbortSignal.timeout`).
- `source.unavailable` med 8–122 ms: cachade fel. Det äldsta serverades cirka 49 s efter att felet uppstod (10:20:49 → 10:21:38).
- 10:07:33: `pending` = 6. Kall cache.
- Första lyckade hämtningen: 10:38:37, 6 032 ms, 289 events, `unplaced` 82, `timeUnknown` 3. En andra hämtning 10:38:38 tog 6 203 ms och missade också cachen.
- Från 10:41: alla 11 källor ok och cache-träffar, 59–475 ms per request.
- Felperiod för malmo-stad: 10:07:30 till 10:38:37, cirka 31 min.

## 5. Kod och dokumentation som granskades

| Fil | Fynd |
|---|---|
| `src/lib/events/fetch-source.ts` | Fel cachades med `cacheLife("seconds")`. |
| `src/lib/events/http.ts` | Nätverksfel loggade bara `err.message`, inte `err.cause`. Timeout via `AbortSignal.timeout(timeoutMs)`. |
| `src/lib/events/aggregate.ts` | `FIRST_PAINT_MS` = 3000. Hämtningar som blivit `pending` hålls vid liv med `after()`. `withTimeout` använder `source.timeoutMs`. |
| `src/lib/events/sources/malmo-stad.ts` | `timeoutMs: 15000`, både för källan och för `fetchText`. |
| `node_modules/next/dist/docs/.../cacheLife.md` | `seconds`: stale 30 s, revalidate 1 s, expire 1 min. Efter `revalidate` serveras cachad version och innehållet hämtas om i bakgrunden. `expire` måste vara större än `revalidate`. |

## 6. Ändringar

- `fetch-source.ts`: `cacheLife("seconds")` → `cacheLife(FAILURE_LIFETIME)`, där `FAILURE_LIFETIME = { stale: 30, revalidate: 15, expire: 16 }`.
- `http.ts`: ny funktion `networkMessage(err)` som lägger till `err.cause.code` i meddelandet, till exempel `fetch failed (UND_ERR_CONNECT_TIMEOUT)`.
- Verifiering: `npx tsc --noEmit` ok, `npm run lint` ok, `EVENTS_LIVE=false npm run build` ok. Inte testat i produktion.
