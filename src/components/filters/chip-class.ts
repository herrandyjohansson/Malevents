import { cn } from "@/lib/utils";

/** A chip: 44px tall on phones (thumb-sized), 36px from `sm` up. Plain module, so server components can use it too. */
export const chipClass = (active: boolean) =>
  cn(
    "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors sm:h-9 sm:px-3 sm:text-xs",
    active
      ? "border-primary/60 bg-primary/20 text-foreground"
      : "text-muted-foreground hover:text-foreground bg-white/[0.03] hover:border-white/20",
  );
