import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

import { renderMarkdown, runBenchmark } from "./benchmark";

const RESULTS = fileURLToPath(new URL("./results/", import.meta.url));

/**
 * `npm run bench:openweb`. Several rounds against the real venue sites,
 * so it only runs when BENCH=1. Writes results/latest.{json,md}.
 */
it.runIf(process.env.BENCH === "1")(
  "benchmark: OpenWeb vs current adapters",
  async () => {
    const report = await runBenchmark({ rounds: Number(process.env.BENCH_ROUNDS ?? 5) });
    await mkdir(RESULTS, { recursive: true });
    await writeFile(`${RESULTS}latest.json`, `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(`${RESULTS}latest.md`, `${renderMarkdown(report)}\n`);
    console.log(renderMarkdown(report));
    expect(report.venues).toHaveLength(3);
  },
  10 * 60_000,
);
