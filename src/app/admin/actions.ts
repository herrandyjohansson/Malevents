"use server";

import { refresh, updateTag } from "next/cache";
import { headers } from "next/headers";

import { isAdminRequestAllowed } from "@/lib/admin-auth";
import { setSourceEnabled } from "@/lib/events/settings";
import { getSource } from "@/lib/events/sources";

// Server Actions are public endpoints, so each one checks auth itself
// rather than relying only on the proxy that guards the admin pages.
async function assertAdmin() {
  if (!isAdminRequestAllowed((await headers()).get("authorization"))) {
    throw new Error("Not authorized");
  }
}

function assertSource(id: string) {
  if (!getSource(id)) throw new Error(`Unknown source "${id}"`);
}

export async function setSourceEnabledAction(id: string, enabled: boolean) {
  await assertAdmin();
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
  await assertAdmin();
  assertSource(id);
  updateTag(`events:${id}`);
}

export async function refreshAllSourcesAction() {
  await assertAdmin();
  updateTag("events");
}
