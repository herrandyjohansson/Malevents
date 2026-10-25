import { readFile, writeFile } from "node:fs/promises";
import { expect, it } from "vitest";

import { mergeDuplicates } from "./dedupe";
import { auditDuplicates } from "./duplicate-audit";
import type { MalmoEvent } from "./types";
import { withCanonicalVenue } from "./venues";

const DIR = "/Users/andyj/.copilot/session-state/6677d373-3671-4373-94f6-a95ceaeced15/files/";
const AGG = new Set(["malmo-stad", "tickster-malmo", "ticket-marketplace", "skane-culture"]);
const ORDER = ["malmo-stad","malmo-live","slagthuset","moriska","malmo-opera","malmo-stadsteater","inkonst","malmo-konsthall","skanes-dansteater","plan-b","spegeln","panora","medley","malmo-arena","hypnos","tickster-malmo","ticket-marketplace","skane-culture"];
const rank = (id: string) => (AGG.has(id) ? 100 : 0) + ORDER.indexOf(id);

function oldMerge(events: MalmoEvent[]) {
  const filled = (e: MalmoEvent) => Object.values(e).filter((v) => v !== undefined && v !== "").length;
  const key = (e: MalmoEvent) => `${e.title.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "")}|${new Date(e.startsAt).toISOString().slice(0, 16)}`;
  const byKey = new Map<string, MalmoEvent>();
  for (const e of events) { const k = key(e); const x = byKey.get(k); if (!x || filled(e) > filled(x)) byKey.set(k, e); }
  return [...byKey.values()];
}
/** The city calendar's old reading: its epoch (kept in the id) as a real instant. */
function oldCityTime(e: MalmoEvent): MalmoEvent {
  if (e.sourceId !== "malmo-stad") return e;
  const epoch = Number(e.id.split("@").pop());
  const shift = epoch - Date.parse(e.startsAt);
  return { ...e, startsAt: new Date(epoch).toISOString(), endsAt: e.endsAt && new Date(Date.parse(e.endsAt) + shift).toISOString() };
}

it("attribution", async () => {
  const snap = JSON.parse(await readFile(`${DIR}duplicate-audit-after-fixes.json`, "utf8"));
  const raw: MalmoEvent[] = snap.rawEvents;
  const stages = {
    baseline: oldMerge(raw.map(oldCityTime)),
    timeFixOnly: oldMerge(raw),
    timeFixAndAliases: oldMerge(raw.map(withCanonicalVenue)),
    allFixes: mergeDuplicates(raw.map(withCanonicalVenue), rank),
  };
  const summary = Object.fromEntries(Object.entries(stages).map(([name, events]) => {
    const a = auditDuplicates(events);
    return [name, { kept: events.length, removed: raw.length - events.length, identityGroups: a.identityGroups.length, identitySurplus: a.identitySupportedSurplus, titlePairs: a.pairs.length, crossSourceTitlePairs: a.pairs.filter((p) => p.crossSource).length, venuePairs: a.venuePairs.length, venues: a.venues }];
  }));
  const byId = new Map(raw.map((e) => [e.id, e]));
  const groups = stages.allFixes.filter((e) => e.duplicateIds).map((e) => ({
    kept: [e.sourceId, e.title, e.startsAt, e.venue?.name],
    merged: e.duplicateIds!.map((id) => { const x = byId.get(id); return x ? [x.sourceId, x.title, x.startsAt, x.venue?.name] : [id]; }),
  }));
  const a = auditDuplicates(stages.allFixes);
  const m = new Map(stages.allFixes.map((e) => [e.id, e]));
  await writeFile(`${DIR}duplicate-attribution.json`, JSON.stringify({ raw: raw.length, summary, groups,
    remainingIdentity: a.sharedLinkPairs.map((p) => ({ ...p, a: [m.get(p.a)?.title, m.get(p.a)?.startsAt, m.get(p.a)?.sourceId], b: [m.get(p.b)?.title, m.get(p.b)?.startsAt, m.get(p.b)?.sourceId] })),
    remainingVenuePairs: a.venuePairs,
    crossSourceTitlePairs: a.pairs.filter((p) => p.crossSource).map((p) => ({ ...p, a: [m.get(p.a)?.title, m.get(p.a)?.startsAt, m.get(p.a)?.sourceId, m.get(p.a)?.venue?.name], b: [m.get(p.b)?.title, m.get(p.b)?.startsAt, m.get(p.b)?.sourceId, m.get(p.b)?.venue?.name] })),
  }, null, 2));
  console.info("ATTRIBUTION", JSON.stringify({ raw: raw.length, summary, mergeGroups: groups.length }, null, 1));
  expect(raw.length).toBeGreaterThan(0);
});
