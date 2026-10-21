"use client";

import { CalendarRange, List } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { filterQuery } from "@/lib/events/filters";
import { cn } from "@/lib/utils";

/** List or month calendar of the same filtered events. The filters carry over; month and day don't. */
export function ViewToggle({ view }: { view: "list" | "calendar" }) {
  const query = filterQuery(new URLSearchParams(useSearchParams()));
  const href = (v: "list" | "calendar") => {
    const params = new URLSearchParams(query);
    if (v === "calendar") params.set("view", "calendar");
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };
  const item = (v: "list" | "calendar", label: string, Icon: typeof List) => (
    <Link
      href={href(v)}
      scroll={false}
      aria-current={view === v ? "page" : undefined}
      className={cn(
        "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors sm:h-9 sm:px-3",
        view === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
  return (
    <nav aria-label="View" className="inline-flex shrink-0 gap-0.5 rounded-full border bg-white/[0.03] p-0.5">
      {item("list", "List", List)}
      {item("calendar", "Calendar", CalendarRange)}
    </nav>
  );
}
