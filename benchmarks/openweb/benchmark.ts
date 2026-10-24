import { USER_AGENT } from "@/lib/events/http";
import type { MalmoEvent } from "@/lib/events/types";

import { isInstalled, siteInfo } from "./openweb";
import { VENUES, type Venue } from "./venues";

/** Fields a visitor notices when they are missing on an event card or page. */
const FIELDS = {
  startTime: (e: MalmoEvent) => !e.timeUnknown,
  endTime: (e: MalmoEvent) => Boolean(e.endsAt),
  price: (e: MalmoEvent) => Boolean(e.price) || e.isFree === true,
  description: (e: MalmoEvent) => Boolean(e.description),
  image: (e: MalmoEvent) => Boolean(e.imageUrl),
  ticketUrl: (e: MalmoEvent) => Boolean(e.ticketUrl),
} as const;

type Field = keyof typeof FIELDS;
type Side = "current" | "openweb";

export interface SideResult {
  runs: number;
  ok: number;
  errors: string[];
  ms: { min: number; median: number; p95: number };
  events: number;
  /** Share of events (0–1) that have each field. */
  completeness: Record<Field, number>;
  links: { checked: number; ok: number };
  requiresBrowser: boolean;
}

export interface VenueResult {
  venue: string;
  current: SideResult;
  openweb: SideResult;
  overlap: { both: number; onlyCurrent: number; onlyOpenweb: number };
}

export interface BenchmarkReport {
  startedAt: string;
  rounds: number;
  /** Median time to start the OpenWeb CLI with no network (`openweb --version`). */
  openwebStartupMs: number;
  venues: VenueResult[];
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return NaN;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

async function timed<T>(fn: () => Promise<T>) {
  const start = performance.now();
  const value = await fn();
  return { value, ms: performance.now() - start };
}

/** GETs a few event pages; a broken link is a worse result than a missing field. */
async function checkLinks(events: MalmoEvent[], sample: number) {
  const urls = [...new Set(events.map((e) => e.url))].slice(0, sample);
  let ok = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow", signal: AbortSignal.timeout(10_000) });
      if (res.ok) ok++;
      await res.body?.cancel();
    } catch {
      // Counted as not ok.
    }
    await pause(250);
  }
  return { checked: urls.length, ok };
}

function summarize(times: number[], errors: string[], runs: number, events: MalmoEvent[], links: SideResult["links"], requiresBrowser: boolean): SideResult {
  const sorted = [...times].sort((a, b) => a - b);
  const share = (has: (e: MalmoEvent) => boolean) => (events.length ? events.filter(has).length / events.length : 0);
  return {
    runs,
    ok: times.length,
    errors,
    ms: { min: sorted[0] ?? NaN, median: quantile(sorted, 0.5), p95: quantile(sorted, 0.95) },
    events: events.length,
    completeness: Object.fromEntries(Object.entries(FIELDS).map(([field, has]) => [field, share(has)])) as Record<Field, number>,
    links,
    requiresBrowser,
  };
}

async function benchmarkVenue(venue: Venue, rounds: number, linkSample: number, gapMs: number): Promise<VenueResult> {
  const fetchers: Record<Side, () => Promise<MalmoEvent[]>> = {
    current: () => venue.current.fetchEvents({ warn: () => {} }),
    openweb: venue.openweb,
  };
  const times: Record<Side, number[]> = { current: [], openweb: [] };
  const errors: Record<Side, string[]> = { current: [], openweb: [] };
  const last: Record<Side, MalmoEvent[]> = { current: [], openweb: [] };

  for (let round = 0; round < rounds; round++) {
    // Alternate which side goes first so neither always meets a warm upstream cache.
    const order: Side[] = round % 2 === 0 ? ["current", "openweb"] : ["openweb", "current"];
    for (const side of order) {
      try {
        const { value, ms } = await timed(fetchers[side]);
        times[side].push(ms);
        last[side] = value;
      } catch (err) {
        errors[side].push((err as Error).message);
      }
      await pause(gapMs);
    }
  }

  const ids = (side: Side) => new Set(last[side].map((e) => e.id));
  const current = ids("current");
  const openweb = ids("openweb");
  const info = await siteInfo(venue.openwebSite);

  return {
    venue: venue.id,
    current: summarize(times.current, errors.current, rounds, last.current, await checkLinks(last.current, linkSample), false),
    openweb: summarize(times.openweb, errors.openweb, rounds, last.openweb, await checkLinks(last.openweb, linkSample), info.requiresBrowser),
    overlap: {
      both: [...current].filter((id) => openweb.has(id)).length,
      onlyCurrent: [...current].filter((id) => !openweb.has(id)).length,
      onlyOpenweb: [...openweb].filter((id) => !current.has(id)).length,
    },
  };
}

export async function runBenchmark({ rounds = 5, linkSample = 5, gapMs = 500 } = {}): Promise<BenchmarkReport> {
  if (!(await isInstalled())) throw new Error("The openweb CLI is not installed (npm install -g @openweb-org/openweb)");
  const startedAt = new Date().toISOString();

  const startup: number[] = [];
  for (let i = 0; i < 5; i++) startup.push((await timed(() => isInstalled())).ms);

  const venues: VenueResult[] = [];
  for (const venue of VENUES) venues.push(await benchmarkVenue(venue, rounds, linkSample, gapMs));

  return { startedAt, rounds, openwebStartupMs: quantile(startup.sort((a, b) => a - b), 0.5), venues };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const ms = (n: number) => (Number.isFinite(n) ? `${Math.round(n)} ms` : "–");

export function renderMarkdown(report: BenchmarkReport) {
  const lines = [
    "# OpenWeb vs current adapters",
    "",
    `Run ${report.startedAt}, ${report.rounds} rounds per side per venue. OpenWeb runs through its CLI;`,
    `starting the CLI alone takes about ${ms(report.openwebStartupMs)}, which is included in its times.`,
    "",
  ];
  for (const v of report.venues) {
    const row = (label: string, value: (s: SideResult) => string) => `| ${label} | ${value(v.current)} | ${value(v.openweb)} |`;
    lines.push(
      `## ${v.venue}`,
      "",
      "| | Current adapter | OpenWeb |",
      "|---|---|---|",
      row("Success", (s) => `${s.ok}/${s.runs}`),
      row("Median time", (s) => ms(s.ms.median)),
      row("p95 time", (s) => ms(s.ms.p95)),
      row("Events", (s) => String(s.events)),
      ...Object.keys(FIELDS).map((f) => row(`Has ${f}`, (s) => pct(s.completeness[f as Field]))),
      row("Links that load", (s) => `${s.links.ok}/${s.links.checked}`),
      row("Needs a browser", (s) => (s.requiresBrowser ? "yes" : "no")),
      "",
      `Same events on both sides: ${v.overlap.both}; only current: ${v.overlap.onlyCurrent}; only OpenWeb: ${v.overlap.onlyOpenweb}.`,
      "",
    );
    for (const side of ["current", "openweb"] as const) {
      const errors = [...new Set(v[side].errors)];
      if (errors.length) lines.push(`Errors (${side}): ${errors.join("; ")}`, "");
    }
  }
  return lines.join("\n");
}
