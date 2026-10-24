# Agent skills and rules

Which AI-agent skills and rules this project uses, where they come from, what they are for here, and what was checked before they were added. Update this page when a skill or rule is added, updated or removed.

## Summary

| Name | Kind | Location | Loaded by Claude Code | Used for |
| --- | --- | --- | --- | --- |
| `tdd-guide` | Skill | `.claude/skills/tdd-guide/` | Yes, automatically | Unit tests, first for the adapter parsers |
| `senior-qa` | Skill | `.claude/skills/senior-qa/` | Yes, automatically | Playwright end-to-end tests per route |
| `a11y-audit` | Skill | `.claude/skills/a11y-audit/` | Yes, automatically | WCAG 2.2 AA audits and contrast checks |
| `find-malmo-event-source` | Skill | `.claude/skills/find-malmo-event-source/` | Yes, automatically | Finding and vetting new event sources; records them in [event-source-candidates.yaml](event-source-candidates.yaml) |
| `security-and-owasp` | Rule | `.claude/rules/security-and-owasp.md` | Yes, for `src/**`, `next.config.ts`, `package.json` | Secure coding (OWASP Top 10); compliance in [security-owasp.md](security-owasp.md) |
| `acquire-codebase-knowledge` | Skill | `.agents/skills/acquire-codebase-knowledge/` | No (not under `.claude/`); followed by hand | Wrote `docs/codebase/` (assignment part A) |

Claude Code picks a skill from its description when a task matches, or you can name it, for example "use the a11y-audit skill" or `/a11y-audit`. Skills under `.claude/skills/` are listed at the start of each session.

## Sources and versions

| Name | Source | Version |
| --- | --- | --- |
| `tdd-guide` | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) `engineering-team/skills/tdd-guide` | commit `19392f7a08264ed00486a251f5b2098321771f94`, installed 2026-10-21 |
| `senior-qa` | same repo, `engineering-team/skills/senior-qa` | same commit |
| `a11y-audit` | same repo, `engineering-team/a11y-audit/skills/a11y-audit` (plugin 2.9.0; only the skill folder is installed, not `plugin.json` or `settings.json`) | same commit |
| `security-and-owasp` | [github/awesome-copilot](https://github.com/github/awesome-copilot) `instructions/security-and-owasp.instructions.md` | commit `c835373ab01633f23e67e1a5713acc9b783915f8`; front matter changed from `applyTo` to `paths` |
| `acquire-codebase-knowledge` | github/awesome-copilot skill, v1.3 | see its `SKILL.md` |
| `find-malmo-event-source` | Written for this project on 2026-10-24 | in this repo |

All are MIT licensed. The skill files are copied unchanged, so they can be compared with upstream.

## What each one is for here

**tdd-guide.** The project has no test framework, and every adapter's parsing (dates, prices, sold-out, listing cards) is only checked by running against live sites. The plan is Vitest unit tests that run each adapter's exported parser on its bundled fixtures, so a venue changing its markup fails a test instead of the live site. The skill supports Vitest and has red-green-refactor and coverage workflows. Not used yet.

**senior-qa.** Its route scaffolder (`scripts/e2e_test_scaffolder.py`) turns `src/app/` into one Playwright spec per route, a starting point for "every tab renders with `EVENTS_LIVE=false`". The component test generator only writes stubs, and the generated login fixture doesn't apply (there is no login), so neither is planned. Not used yet.

**a11y-audit.** Static WCAG 2.2 scan of `src/` and a contrast checker for the dark theme. Baseline on 2026-10-21: `a11y_scanner.py src --severity major` found no issues in 65 files. It is a pattern scanner, so it doesn't replace testing the map, calendar and bottom sheet with a keyboard and a screen reader (`references/testing-checklist.md`).

**find-malmo-event-source.** Discovers venues not covered yet, finds the JSON or feed behind their event pages and checks that a server can read it (no browser, key or login), then records the result in `docs/event-source-candidates.yaml` and stops for the user to choose. It writes no adapters. `scripts/check-endpoint.sh` makes one plain GET with the `MaleventsBot` user agent and prints the `robots.txt` rules; `scripts/capture.sh` records a page's requests with [OpenWeb](https://github.com/openweb-org/openweb) (`npm install -g @openweb-org/openweb`, MIT), which is how the Plan B (`/api/eventsEdge`) and Panora (`bio.se/api/cinemas/films`) feeds were found. First run 2026-10-24: five sources worth building (Spegeln, Panora via bio.se, Medley, Malmö Arena, Hypnos).

Known quirks: OpenWeb is a global CLI, not a project dependency, so the skill falls back to the DevTools network tab without it. `capture.sh` gives OpenWeb an empty Chrome profile (the default copies the user's Chrome cookies) and opens the page through CDP after capture starts, because `capture start --isolate` attaches after the load and records nothing. It uses port 9222 and stops OpenWeb's managed browser when it exits.

## Review before installing

Every file was read or scanned before it was copied into the project, at the pinned commit:

- **Scripts** use only the Python standard library: no network, subprocess, `eval` or `exec`. They read source files and write only generated files.
- **Markdown and JSON** contain no instructions aimed at the agent, hidden text or unexpected links. "password" and "token" appear only in test examples.
- **SKILL.md files** were read in full, since they are what enters the agent's context.
- **Smoke test** against this repo: the a11y scanner, contrast checker, component scan and route scaffolder all ran.

Known quirks:

- `senior-qa/scripts/e2e_test_scaffolder.py` writes `playwright.config.ts` into the **current directory**, not into `--output`, when no such file exists. Run it from a scratch directory, or remove the file afterwards.
- `a11y-audit/scripts/contrast_checker.py` takes colours as positional arguments (`contrast_checker.py "#fg" "#bg"`), not `--fg`/`--bg` as its SKILL.md says.
- The scripts need Python 3.8 or newer. Run them as `python3 -I <script>` so they don't import modules from the working directory.

## Updating a skill

1. Download the new version at a pinned commit into a scratch directory.
2. Diff it against the installed folder and review what changed, as above.
3. Copy it in, then update the commit and date in this page.

## Other agent files in the repo

These were not added as part of this work and are not covered by the review above:

- **`impeccable`**: a frontend design skill (v4.7.0, Apache 2.0) in `.claude/skills/impeccable/` and `.agents/skills/impeccable/`, with four `impeccable-*` agents in `.claude/agents/` and a `.codex/` folder. Added by the owner on 2026-10-21. Its launcher (`scripts/impeccable`) was read before use: it runs the bundled `bin/darwin-arm64` engine and only downloads one, checksum-verified, when none is bundled; the compiled engine itself was not reviewed. Used on 2026-10-21 for `hooks on` (design detector after each UI edit, config in `.impeccable/config.json`), a full-site `critique` (snapshot in `.impeccable/critique/`) and the redesign that followed: `init` wrote `PRODUCT.md`, then distill, layout, optimize, shape, clarify, harden and polish. One detector exception is recorded in `.impeccable/config.json`: `side-tab` in `calendar-view.tsx`, where the coloured left border carries the event's category.
- **`.claude/agents/aem-frontend-specialist.agent.md`**: a GitHub Copilot agent for Adobe Experience Manager. It doesn't apply to this Next.js project.

## Built-in skills used during development

Claude Code's built-in `dataviz` skill guided the charts on `/admin/logs`: a stat tile row, a single-series sparkline with hover, a meter, status shown with icon and label, and a table for the per-source data.
