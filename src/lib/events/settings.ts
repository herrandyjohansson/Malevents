import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Per-source admin settings. Stored in a JSON file, which works for local
 * use and a single long-running server. On serverless hosts the file system
 * is read-only or per-instance, so swap this module for a database or KV
 * store (same two functions) before deploying there.
 */
export interface SourceSettings {
  enabled: boolean;
}

const FILE = path.join(process.cwd(), ".data", "source-settings.json");

export async function getSourceSettings(): Promise<Record<string, SourceSettings>> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function setSourceEnabled(id: string, enabled: boolean) {
  const settings = await getSourceSettings();
  settings[id] = { ...settings[id], enabled };
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(settings, null, 2));
}
