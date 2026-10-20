# Security: OWASP rules

The project follows the OWASP Top 10 (2025) rules in [`.claude/rules/security-and-owasp.md`](../.claude/rules/security-and-owasp.md), copied from [github/awesome-copilot](https://github.com/github/awesome-copilot/blob/main/instructions/security-and-owasp.instructions.md). Claude Code loads them when it works on `src/`, `next.config.ts` or `package.json`.

This page records how each rule that applies is met, and the exceptions that are accepted on purpose. Most rules don't apply: Malevents has no database, user accounts, sessions, cookies, JWTs, file uploads, webhooks, LLM calls or XML input, and doesn't use Express, Angular or Go.

## Status per rule

| Rule | Status | How |
| --- | --- | --- |
| I4, FE1 XSS via raw HTML | Met | No `dangerouslySetInnerHTML` or `innerHTML`. Leaflet popups are built with `textContent`. |
| I5 SSRF | Met, with a limit | `http.ts` fetches only public `http(s)` URLs. It refuses local names, private, loopback and link-local IPv4 literals and IPv6 literals, and checks every redirect hop. Scraped detail-page links are fetched, so this matters if a venue site changes or is compromised. Host names are not resolved, so a public name pointing at a private address is not caught. |
| I6 Path traversal | Met | `settings.ts` writes one fixed path; the source id is checked against the registry first. |
| FE2 eval | Met | None. |
| FE4 Prototype pollution | Met | Settings keys are registry source ids only. |
| FE5 Open redirect | Met | The only programmatic redirect goes to `/`. |
| FE6 Sensitive data in localStorage | Met | Only saved events and the admin-mode flag. |
| FE7 CSRF | Met | Server Actions check the Origin header (Next.js). |
| FE8, AZ4 Server-side input validation | Met | Search params go through `parseFilters` and `isDay`; Server Action arguments are type-checked at runtime; links from upstreams are reduced to `http(s)` (`normalize.ts`). |
| S1–S3 Secrets | Met | No secrets, API keys or `NEXT_PUBLIC_` variables; `.env*` is git-ignored. |
| S6, A10 Errors to visitors | Met | `error.tsx` shows a generic message; visitors don't see upstream error messages (the admin does). |
| RX2 `process.env` in client code | Met | None. |
| RX3 Data passed to client components | Met | Map and calendar get only the fields they show (`view-types.ts`). |
| H3–H7 Security headers | Met | `next.config.ts`: HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. `X-Powered-By` is turned off. |
| H8 CORS | Met | The app sets no CORS headers and uses no credentials. Vercel adds `Access-Control-Allow-Origin: *` to static responses, which carry no private data. |
| L1 Security events logged | Met | `admin.*` lines for every admin action, rejected input (`admin.input_rejected`) and cooldown hits (`admin.rate_limited`). |
| L2 Sensitive data in logs | Met | No secrets exist; logs hold ids and numbers; request paths are logged without query strings. |
| L4 Log injection | Met | JSON lines through `src/lib/log.ts`. |
| D2, D5 Lockfile and versions | Met | `package-lock.json` is committed; no `*` or `latest` ranges. |

## Accepted exceptions

| Rule | Why it is accepted |
| --- | --- |
| RX1, AZ1, AZ2 Admin without auth (critical) | `/admin` and its Server Actions are open during development, by the owner's decision. The admin-mode toggle only hides the tab. What an attacker can do: switch sources off where the settings file is writable (not on Vercel) and refresh caches. `/admin/logs` and its JSONL download are open too; they show upstream URLs, timings and error messages, but no secrets or visitor input (L2). Must be fixed before a public launch (see CLAUDE.md). |
| AP1 Rate limiting | The refresh actions have a 60 s cooldown per cache tag. It is kept in memory, so it holds per server instance, not across all of them. A shared limit would need a store such as Redis, which the project avoids (free, keyless tools only). |
| H1, H2 Content-Security-Policy without `script-src` | A nonce-based `script-src` makes every page render per request, which would turn off the prerendered static shells. The CSP covers framing, plugins, `<base>` and form targets. |
| L3 Trace ids | Logs inside the shared source cache can't carry a request id. On Vercel, each log line is already grouped under its request in the Logs view. |
| D1 Vulnerable dependencies | `npm audit --omit=dev` reports none. `npm audit` reports 5 high advisories, all from `braces` (stack exhaustion on hostile glob patterns) in `eslint-config-next` → `fast-glob`. It runs only in lint, on the project's own globs, and no fixed `braces` release exists. Re-check after `eslint-config-next` updates. |

## Checks to run

```bash
npm audit --omit=dev                      # production dependencies
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(" src
curl -sI http://localhost:3000 | grep -iE "strict-transport|x-frame|content-security|x-powered-by"
```
