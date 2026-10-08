"use client";

import { useSyncExternalStore } from "react";

/**
 * "Admin mode" is a per-browser UI preference that shows the Admin tab.
 * It is not access control: the admin pages themselves are unprotected.
 */
const KEY = "malevents:admin-mode";
const EVENT = "malevents:admin-mode-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function useAdminMode(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => false);
  const set = (next: boolean) => {
    try {
      if (next) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch {
      // Storage unavailable (private mode); the toggle just won't persist.
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, set];
}
