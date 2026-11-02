# Security: OWASP rules

The project follows the OWASP Top 10 (2025) rules in [`.claude/rules/security-and-owasp.md`](../.claude/rules/security-and-owasp.md), copied from [github/awesome-copilot](https://github.com/github/awesome-copilot/blob/main/instructions/security-and-owasp.instructions.md). Claude Code loads them when it works on `src/`, `next.config.ts` or `package.json`.

This page records how each rule that applies is met, and the exceptions that are accepted on purpose. Most rules don't apply: Malevents has no database, user accounts, sessions, cookies, JWTs, file uploads, webhooks, LLM calls or XML input, and doesn't use Express, Angular or Go.

## Status per rule

| Rule | Status | How |
| --- | --- | --- |
| I4, FE1 XSS via raw HTML | Met | No `dangerouslySetInnerHTML` or `innerHTML`. Leaflet popups are built with `textContent`. The one third-party SVG served from the site's own origin (the coat of arms, `public/brand/` and `src/app/icon.svg`) was checked for scripts, event handlers, `foreignObject` and external references, and has none. |
| I5 SSRF | Met, with a limit | `http.ts` fetches only public `http(s)` URLs, for GET and for the one JSON POST (bio.se, fixed URL and body set in the adapter). It refuses local names, private, loopback and link-local IPv4 literals and IPv6 literals, and checks every redirect hop. Scraped detail-page links are fetched, so this matters if a venue site changes or is compromised. Host names are not resolved, so a public name pointing at a private address is not caught. |
| I6 Path traversal | Met | The app writes no files and reads none from visitor input. |
| FE2 eval | Met | None. |
| FE4 Prototype pollution | Met | No object is built from visitor-supplied keys; search params are read into fixed fields (`parseFilters`). |
| FE5 Open redirect | Met | The only programmatic redirect goes to `/`. The redirects in `next.config.ts` (old tabs, other names of a venue) go to fixed paths on the site, built from a hand-written table, never from visitor input. |
| FE6 Sensitive data in localStorage | Met | Only saved events and the admin-mode flag. |
| FE7 CSRF | Met | Nothing to forge: the site has no Server Actions, forms or routes that change state. |
| FE8, AZ4 Server-side input validation | Met | Search params go through `parseFilters` and `isDay`; `EVENTS_DISABLED_SOURCES` ids are matched against the registry, and unknown ones are ignored and flagged in `/admin`; links from upstreams are reduced to `http(s)` (`normalize.ts`). |
| S1–S3 Secrets | Met | No secrets, API keys or `NEXT_PUBLIC_` variables; `.env*` is git-ignored. |
| S6, A10 Errors to visitors | Met | `error.tsx` shows a generic message. Visitors see no upstream errors or source states (no "unavailable", no slow-site names); a failing source is left out of the lists, and `/admin` shows why. |
| RX2 `process.env` in client code | Met | None. |
| RX3 Data passed to client components | Met | Map and calendar get only the fields they show (`view-types.ts`). Tonight's MiniSearch index gets compact public event and venue records (`search-data.ts`), not full upstream objects. Queries are limited to 100 characters, rendered as text, and never logged or sent to an external search service. |
| H3–H7 Security headers | Met | `next.config.ts`: HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. `X-Powered-By` is turned off. |
| H8 CORS | Met | The app sets no CORS headers and uses no credentials. Vercel adds `Access-Control-Allow-Origin: *` to static responses, which carry no private data. |
| L1 Security events logged | Met | The site has no security-relevant actions to log: no login, and the admin is read-only. Upstream failures and request outcomes are logged (`source.*`, `http.*`). Settings changes happen in Vercel, which records who changed an environment variable or redeployed. |
| L2 Sensitive data in logs | Met | No secrets exist; logs hold ids and numbers; request paths are logged without query strings. |
| L4 Log injection | Met | JSON lines through `src/lib/log.ts`. |
| AP1 Rate limiting | Met by design | No endpoint makes the server do work on demand: there are no Server Actions or refresh buttons, and upstream sites are fetched only on a cache miss, shared across requests. Cache refreshes are done with the Vercel CLI. |
| D2, D5 Lockfile and versions | Met | `package-lock.json` is committed; no `*` or `latest` ranges. |

## Accepted exceptions

| Rule | Why it is accepted |
| --- | --- |
| RX1, AZ1, AZ2 Admin without auth | `/admin` has no login, by the owner's decision, so it is read-only: it has no Server Actions, forms or routes that change anything. Sources are switched off with `EVENTS_DISABLED_SOURCES` and caches refreshed with `vercel cache invalidate`, both in Vercel, where only project members can act. The admin-mode toggle only hides the tab. Anyone with the URL can still read `/admin`, `/admin/logs` and its JSONL download: upstream URLs, timings and error messages, but no secrets or visitor input (L2). To hide those too, put Vercel password protection or a login in front of `/admin`. |
| H1, H2 Content-Security-Policy without `script-src` | A nonce-based `script-src` makes every page render per request, which would turn off the prerendered static shells. The CSP covers framing, plugins, `<base>` and form targets. |
| L3 Trace ids | Logs inside the shared source cache can't carry a request id. On Vercel, each log line is already grouped under its request in the Logs view. |
| D1 Vulnerable dependencies | `npm audit --omit=dev` reports none (2 November 2026, after `undici` under `cheerio` was patched to 7.30.1). `npm audit` still reports advisories in development tools, which never run on the server or in the browser: `vitest` and `tinypool` (critical, fixed only in Vitest 5, a major upgrade), `zod` under `eslint-plugin-react-hooks` (high) and the ESLint stack (moderate). Re-check after upgrading Vitest or `eslint-config-next`. |

## Checks to run

```bash
npm audit --omit=dev                      # production dependencies
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(" src
curl -sI http://localhost:3000 | grep -iE "strict-transport|x-frame|content-security|x-powered-by"
```
