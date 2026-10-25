"use client";

import { useSyncExternalStore } from "react";

import { isSameSaved, type SavedEvent } from "./saved-snapshot";

export type { SavedEvent };

const KEY = "malevents:saved";
const EVENT = "malevents:saved-change";
const EMPTY: SavedEvent[] = [];

let cache: { raw: string | null; list: SavedEvent[] } = { raw: null, list: EMPTY };

function read(): SavedEvent[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  // Same string, same array: useSyncExternalStore needs a stable snapshot.
  if (raw === cache.raw) return cache.list;
  let list: SavedEvent[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter((e) => e && typeof e.id === "string" && typeof e.title === "string");
  } catch {
    // Corrupt value: start over.
  }
  cache = { raw, list };
  return list;
}

function write(list: SavedEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or unavailable (private mode); saving just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSavedEvents() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Whether this event is saved, also when it was saved under a listing since merged into it. */
export function useIsSaved(event: Pick<SavedEvent, "id" | "duplicateIds">) {
  return useSavedEvents().some((saved) => isSameSaved(saved, event));
}

/** Unsaving removes every saved copy of the event, under any of its ids. */
export function toggleSaved(event: Omit<SavedEvent, "savedAt"> & { savedAt?: string }) {
  const list = read();
  if (list.some((saved) => isSameSaved(saved, event))) write(list.filter((saved) => !isSameSaved(saved, event)));
  else write([...list, { ...event, savedAt: event.savedAt ?? new Date().toISOString() }]);
}

export function removeSaved(ids: string[]) {
  write(read().filter((e) => !ids.includes(e.id)));
}
