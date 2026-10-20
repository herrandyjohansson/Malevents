"use server";

import { refresh, updateTag } from "next/cache";

import { setSourceEnabled } from "@/lib/events/settings";
import { getSource } from "@/lib/events/sources";
import { errorMessage, log } from "@/lib/log";

// The admin has no login by design (an accepted risk until a public launch,
// see docs/security-owasp.md); "admin mode" only shows or hides the tab.
// Every action is logged, rejected input included, so its use can be seen.

type ActionResult = { ok: true } | { ok: false; error: string };

/** Least time between two refreshes of the same cache tag. */
const REFRESH_COOLDOWN_MS = 60_000;
/**
 * When each tag was last refreshed. In memory, so the limit holds per server
 * instance rather than globally: enough to stop one client from forcing a
 * re-scrape of every venue site in a loop.
 */
const lastRefresh = new Map<string, number>();

/** Server Actions are public endpoints: arguments are untrusted whatever their declared types. */
function assertSource(action: string, id: unknown): asserts id is string {
  if (typeof id === "string" && getSource(id)) return;
  log.warn("admin.input_rejected", { action, reason: "unknown_source", source: String(id).slice(0, 100) });
  throw new Error("Unknown source");
}

/** Check and record the cooldown for a tag; false if it was refreshed too recently. */
function takeRefresh(tag: string) {
  const now = Date.now();
  const last = lastRefresh.get(tag) ?? 0;
  if (now - last < REFRESH_COOLDOWN_MS) {
    log.warn("admin.rate_limited", { tag, retryInS: Math.ceil((last + REFRESH_COOLDOWN_MS - now) / 1000) });
    return false;
  }
  lastRefresh.set(tag, now);
  return true;
}

const TOO_SOON = "Refreshed less than a minute ago. Try again shortly.";

export async function setSourceEnabledAction(id: string, enabled: boolean): Promise<ActionResult> {
  assertSource("setSourceEnabled", id);
  if (typeof enabled !== "boolean") {
    log.warn("admin.input_rejected", { action: "setSourceEnabled", reason: "enabled_not_boolean", source: id });
    throw new Error("`enabled` must be true or false");
  }
  try {
    await setSourceEnabled(id, enabled);
  } catch (err) {
    log.error("admin.source_toggle_failed", { source: id, enabled, error: errorMessage(err) });
    return { ok: false, error: "Couldn't save the setting. Is the settings file writable?" };
  }
  log.info("admin.source_toggled", { source: id, enabled });
  refresh();
  return { ok: true };
}

/** Drop a source's cached response so the next request fetches it fresh. */
export async function refreshSourceAction(id: string): Promise<ActionResult> {
  assertSource("refreshSource", id);
  const tag = `events:${id}`;
  if (!takeRefresh(tag)) return { ok: false, error: TOO_SOON };
  log.info("admin.cache_refreshed", { source: id });
  updateTag(tag);
  return { ok: true };
}

export async function refreshAllSourcesAction(): Promise<ActionResult> {
  if (!takeRefresh("events")) return { ok: false, error: TOO_SOON };
  log.info("admin.cache_refreshed", { source: "all" });
  updateTag("events");
  return { ok: true };
}
