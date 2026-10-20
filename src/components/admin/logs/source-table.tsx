import { CircleAlert, CircleCheck, CircleX, Minus } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIME_ZONE } from "@/lib/events/config";
import { formatBytes, formatMs } from "@/lib/format-number";
import type { SourceRow } from "@/lib/log-analysis";
import { cn } from "@/lib/utils";

// Server-rendered only, so Intl can't cause a hydration mismatch here; Malmö time like the stream.
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Health from this server's own fetches: failing, degraded (warnings or failed requests), healthy, or unknown. */
function health(r: SourceRow) {
  if (r.fetches === 0) return { label: "No fetch", icon: Minus, className: "text-muted-foreground" };
  if (r.lastError) return { label: "Failing", icon: CircleX, className: "text-destructive" };
  if (r.lastWarning || r.requestFailures > 0) return { label: "Degraded", icon: CircleAlert, className: "text-warning" };
  return { label: "Healthy", icon: CircleCheck, className: "text-success" };
}

/**
 * A row per source with what its upstream fetches and requests cost. The bar
 * shows the average fetch time against the slowest source; the number beside
 * it is the value, so the bar is never the only way to read it.
 */
export function SourceTable({ rows }: { rows: SourceRow[] }) {
  const slowest = Math.max(1, ...rows.map((r) => r.avgFetchMs ?? 0));
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Source</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Avg fetch</TableHead>
            <TableHead className="text-right">Fetches</TableHead>
            <TableHead className="text-right">Requests</TableHead>
            <TableHead className="text-right">Failed</TableHead>
            <TableHead className="text-right">Avg request</TableHead>
            <TableHead className="text-right">Data</TableHead>
            <TableHead className="text-right">Cache hits</TableHead>
            <TableHead className="pr-4">Last fetch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                Nothing logged for sources yet.
              </TableCell>
            </TableRow>
          )}
          {rows.map((r) => {
            const h = health(r);
            const Icon = h.icon;
            const looked = r.cacheHits + r.cacheMisses;
            const reasons = Object.entries(r.failureReasons)
              .map(([reason, n]) => `${reason} ${n}`)
              .join(", ");
            return (
              <TableRow key={r.id}>
                <TableCell className="pl-4">
                  <Link href={`?source=${r.id}`} className="font-medium hover:underline">
                    {r.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", h.className)}>
                    <Icon className="size-3.5" aria-hidden />
                    {h.label}
                  </span>
                  {(r.lastError ?? r.lastWarning) && (
                    <p className="text-muted-foreground max-w-56 truncate text-xs" title={r.lastError ?? r.lastWarning}>
                      {r.lastError ?? r.lastWarning}
                    </p>
                  )}
                </TableCell>
                <TableCell className="min-w-40">
                  {r.avgFetchMs !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 h-1.5 w-24 rounded-full" aria-hidden>
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.max(4, (r.avgFetchMs / slowest) * 100)}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{formatMs(r.avgFetchMs)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.fetches}
                  {r.fetchFailures > 0 && <span className="text-destructive"> ({r.fetchFailures} failed)</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.requests}</TableCell>
                <TableCell className="text-right tabular-nums" title={reasons || undefined}>
                  {r.requestFailures > 0 ? (
                    <span className="text-destructive">
                      {r.requestFailures}
                      <span className="text-muted-foreground block text-[11px]">{reasons}</span>
                    </span>
                  ) : (
                    0
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
                  {r.avgRequestMs !== undefined ? formatMs(r.avgRequestMs) : "–"}
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
                  {r.bytes ? formatBytes(r.bytes) : "–"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {looked ? `${Math.round((r.cacheHits / looked) * 100)}%` : "–"}
                  {looked > 0 && <span className="text-muted-foreground block text-[11px]">of {looked}</span>}
                </TableCell>
                <TableCell className="text-muted-foreground min-w-44 pr-4 text-xs whitespace-normal">
                  {r.lastFetchAt ? (
                    <>
                      <time dateTime={r.lastFetchAt}>{clock.format(new Date(r.lastFetchAt))}</time>
                      {r.lastEvents !== undefined && (
                        <span className="block">
                          {r.lastEvents} events
                          {r.lastUnplaced ? `, ${r.lastUnplaced} unplaced` : ""}
                          {r.lastTimeUnknown ? `, ${r.lastTimeUnknown} no time` : ""}
                        </span>
                      )}
                    </>
                  ) : (
                    "–"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
