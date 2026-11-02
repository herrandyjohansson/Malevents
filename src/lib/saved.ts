"use client";

import { useSyncExternalStore } from "react";

import { isSameSaved, parseSaved, type SavedEvent } from "./saved-snapshot";

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
  const list = parseSaved(raw);
  cache = { raw, list };
  return list;
}

/** Shown when the browser refuses to store saved events. */
export const SAVE_BLOCKED_MESSAGE = "Couldn't save: this browser is blocking storage (private mode?).";

/** Store the list; false when the browser refused it (storage full or blocked). */
function write(list: SavedEvent[]) {
  let stored = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    stored = false;
  }
  window.dispatchEvent(new Event(EVENT));
  return stored;
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

/** Unsaving removes every saved copy of the event, under any of its ids. False when the browser didn't store the change. */
export function toggleSaved(event: Omit<SavedEvent, "savedAt"> & { savedAt?: string }) {
  const list = read();
  if (list.some((saved) => isSameSaved(saved, event))) return write(list.filter((saved) => !isSameSaved(saved, event)));
  return write([...list, { ...event, savedAt: event.savedAt ?? new Date().toISOString() }]);
}

export function removeSaved(ids: string[]) {
  return write(read().filter((e) => !ids.includes(e.id)));
}
