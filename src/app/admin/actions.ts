"use server";

import { refresh, updateTag } from "next/cache";

import { setSourceEnabled } from "@/lib/events/settings";
import { getSource } from "@/lib/events/sources";
import { errorMessage, log } from "@/lib/log";

// The admin has no login by design; "admin mode" only shows or hides the tab.
// Every action is logged so its use can be seen until it gets protection.

function assertSource(id: string) {
  if (!getSource(id)) throw new Error(`Unknown source "${id}"`);
}

export async function setSourceEnabledAction(id: string, enabled: boolean) {
  assertSource(id);
  // Server Actions are public endpoints: the type above is not checked at runtime.
  if (typeof enabled !== "boolean") throw new Error("`enabled` must be true or false");
  try {
    await setSourceEnabled(id, enabled);
  } catch (err) {
    log.error("admin.source_toggle_failed", { source: id, enabled, error: errorMessage(err) });
    return { ok: false as const, error: "Couldn't save the setting. Is the settings file writable?" };
  }
  log.info("admin.source_toggled", { source: id, enabled });
  refresh();
  return { ok: true as const };
}

/** Drop a source's cached response so the next request fetches it fresh. */
export async function refreshSourceAction(id: string) {
  assertSource(id);
  log.info("admin.cache_refreshed", { source: id });
  updateTag(`events:${id}`);
}

export async function refreshAllSourcesAction() {
  log.info("admin.cache_refreshed", { source: "all" });
  updateTag("events");
}
