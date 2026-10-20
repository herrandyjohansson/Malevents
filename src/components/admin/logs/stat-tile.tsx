import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * One headline number: label, value, an optional line under it and an
 * optional figure (sparkline or meter) at the bottom. Values use proportional
 * figures; tabular ones are for columns.
 */
export function StatTile({
  label,
  value,
  hint,
  tone,
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Status colour for the hint, only when the number means good or bad. */
  tone?: "warning" | "critical";
  children?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex h-full flex-col gap-1 px-4">
        <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
        <dd className="text-2xl font-semibold">{value}</dd>
        {hint && (
          <p
            className={cn(
              "text-xs",
              tone === "critical" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-muted-foreground",
            )}
          >
            {hint}
          </p>
        )}
        {children && <div className="mt-auto pt-2">{children}</div>}
      </CardContent>
    </Card>
  );
}
