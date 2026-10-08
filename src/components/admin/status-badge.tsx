import { Badge } from "@/components/ui/badge";
import type { SourceStatus } from "@/lib/events/types";
import { cn } from "@/lib/utils";

const STYLES: Record<SourceStatus["state"], { label: string; className: string; dot: string }> = {
  ok: { label: "Healthy", className: "border-success/30 bg-success/10 text-success", dot: "bg-success" },
  error: { label: "Failing", className: "border-destructive/30 bg-destructive/10 text-destructive", dot: "bg-destructive" },
  disabled: { label: "Disabled", className: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export function StatusBadge({ state }: { state: SourceStatus["state"] }) {
  const style = STYLES[state];
  return (
    <Badge variant="outline" className={cn("gap-1.5", style.className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </Badge>
  );
}
