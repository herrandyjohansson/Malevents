import { readFile, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { auditDuplicates } from "./duplicate-audit";
import type { MalmoEvent } from "./types";

describe.runIf(Boolean(process.env.DUPLICATE_AUDIT_INPUT))("captured duplicate evidence", () => {
  it("replays diagnostic rules on a fixed snapshot without upstream requests", async () => {
    const input = process.env.DUPLICATE_AUDIT_INPUT;
    const output = process.env.DUPLICATE_AUDIT_ANALYSIS;
    if (!input || !output) throw new Error("Set DUPLICATE_AUDIT_INPUT and DUPLICATE_AUDIT_ANALYSIS to explicit JSON paths");
    const snapshot: { capturedAt: string; events: MalmoEvent[] } = JSON.parse(await readFile(input, "utf8"));
    expect(snapshot.events.length).toBeGreaterThan(0);
    const audit = auditDuplicates(snapshot.events);
    await writeFile(output, JSON.stringify({ capturedAt: snapshot.capturedAt, ...audit }, null, 2) + "\n");
    expect(audit.exactIds).toEqual([]);
    console.info("duplicate_audit.replay", JSON.stringify({
      events: audit.events, pairs: audit.pairs.length, identityPairs: audit.sharedLinkPairs.length,
      identityGroups: audit.identityGroups.length, identitySupportedSurplus: audit.identitySupportedSurplus,
      venuePairs: audit.venuePairs.length, output,
    }));
  });
});
