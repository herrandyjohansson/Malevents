"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_FILTERS } from "@/lib/events/filters";

import { useFilters } from "./use-filters";

export function ClearFiltersButton({ mode = "server" }: { mode?: "server" | "client" }) {
  const { setFilters } = useFilters(mode);
  return (
    <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
      Clear filters
    </Button>
  );
}
