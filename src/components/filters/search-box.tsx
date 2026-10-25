"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

/** Free-text search, debounced so typing doesn't re-filter on every key. */
export function SearchBox({
  value,
  onCommit,
  autoFocus,
  placeholder = "Search events, artists or venues",
}: {
  value: string;
  onCommit: (q: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  // Follow outside changes (e.g. "Clear all") without fighting the user's typing.
  if (value !== synced) {
    setSynced(value);
    if (value !== text.trim()) setText(value);
  }

  useEffect(() => {
    if (text.trim() === value) return;
    const id = setTimeout(() => onCommit(text.trim()), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="relative flex-1">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label="Search events, artists or venues"
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-full border bg-white/[0.04] pr-9 pl-10 text-sm outline-none transition-[box-shadow,border-color] focus-visible:ring-[3px] [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            onCommit("");
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-accent absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
