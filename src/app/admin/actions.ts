"use server";

import { refresh, updateTag } from "next/cache";

import { setSourceEnabled } from "@/lib/events/settings";
import { getSource } from "@/lib/events/sources";

// The admin has no login by design; "admin mode" only shows or hides the tab.

function assertSource(id: string) {
  if (!getSource(id)) throw new Error(`Unknown source "${id}"`);
}

export async function setSourceEnabledAction(id: string, enabled: boolean) {
  assertSource(id);
  try {
    await setSourceEnabled(id, enabled);
  } catch {
    return { ok: false as const, error: "Couldn't save the setting. Is the settings file writable?" };
  }
  refresh();
  return { ok: true as const };
}

/** Drop a source's cached response so the next request fetches it fresh. */
export async function refreshSourceAction(id: string) {
  assertSource(id);
  updateTag(`events:${id}`);
}

export async function refreshAllSourcesAction() {
  updateTag("events");
}
