import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);

/** The site packages for this benchmark live here, apart from the user's own ~/.openweb. */
export const OPENWEB_HOME = fileURLToPath(new URL("./home", import.meta.url));

export interface SiteInfo {
  transport: string;
  requiresBrowser: boolean;
  requiresLogin: boolean;
  operations: string[];
}

/** stdout is one JSON value, but macOS can print a stray PlistBuddy line first. */
function lastJson(stdout: string): unknown {
  const line = stdout.trim().split("\n").reverse().find((l) => l.startsWith("{") || l.startsWith("["));
  if (!line) throw new Error(`openweb printed no JSON: ${stdout.slice(0, 200)}`);
  return JSON.parse(line);
}

async function openweb(args: string[], timeoutMs = 30_000) {
  try {
    const { stdout } = await exec("openweb", args, {
      env: { ...process.env, OPENWEB_HOME },
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    // Failures are a JSON line on stderr with a failureClass.
    const stderr = (err as { stderr?: string }).stderr ?? "";
    const detail = stderr.split("\n").find((l) => l.startsWith("{")) ?? (err as Error).message;
    throw new Error(`openweb ${args.slice(0, 2).join(" ")} failed: ${detail}`);
  }
}

export async function isInstalled() {
  try {
    await openweb(["--version"], 10_000);
    return true;
  } catch {
    return false;
  }
}

/**
 * `openweb <site>` as data: how the site is reached and what it can do.
 * Transport and browser needs are only in the text output, not `--json`.
 */
export async function siteInfo(site: string): Promise<SiteInfo> {
  const text = await openweb([site]);
  const field = (label: string) => text.match(new RegExp(`^${label}:\\s+(.+)$`, "m"))?.[1].trim() ?? "";
  const { operations } = lastJson(await openweb([site, "--json"])) as { operations: { id: string }[] };
  return {
    transport: field("Transport"),
    requiresBrowser: field("Requires browser") === "yes",
    requiresLogin: field("Requires login") === "yes",
    operations: operations.map((op) => op.id),
  };
}

/**
 * Runs one operation through the CLI, the way an agent would. Responses
 * are written to a temp file (`--output file`) so large listings are not
 * cut at the 4 KB stdout limit.
 */
export async function runOperation<T>(site: string, operation: string, params: Record<string, unknown> = {}): Promise<T> {
  const result = lastJson(await openweb([site, operation, JSON.stringify(params), "--output", "file"])) as {
    status: number;
    output: string;
  };
  try {
    if (result.status !== 200) throw new Error(`openweb ${site} ${operation}: HTTP ${result.status}`);
    return JSON.parse(await readFile(result.output, "utf8")) as T;
  } finally {
    await rm(result.output, { force: true });
  }
}
