import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { LogFilters } from "@/components/admin/logs/log-filters";
import { LogStream } from "@/components/admin/logs/log-stream";
import { Meter } from "@/components/admin/logs/meter";
import { SourceTable } from "@/components/admin/logs/source-table";
import { Sparkline } from "@/components/admin/logs/sparkline";
import { StatTile } from "@/components/admin/logs/stat-tile";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TIME_ZONE } from "@/lib/events/config";
import { SOURCE_META } from "@/lib/events/sources";
import { recentLogs } from "@/lib/log";
import { analyzeLogs, filterStream, inWindow, parseLogFilters } from "@/lib/log-analysis";
import { formatBytes, formatCount, formatMs } from "@/lib/format-number";

export const metadata: Metadata = { title: "Logs · Admin", robots: { index: false } };

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Rows rendered in the stream; the download has everything. */
const STREAM_LIMIT = 300;

export default function LogsPage({ searchParams }: PageProps<"/admin/logs">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-10 sm:px-6">
      <PageHeader
        title="Logs"
        description="What the server has logged: page loads, cache hits, every upstream fetch and request, admin actions and errors."
      >
        <AdminNav />
      </PageHeader>
      <Suspense fallback={<LogsSkeleton />}>
        <LogsDashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

async function LogsDashboard({ searchParams }: { searchParams: PageProps<"/admin/logs">["searchParams"] }) {
  const filters = parseLogFilters(await searchParams);
  // The buffer changes with every request, so this is never prerendered.
  await connection();
  const { startedAt, entries: all } = recentLogs();
  const entries = inWindow(all, filters.window, new Date());
  const a = analyzeLogs(entries, filters.source);
  const stream = filterStream(entries, filters);
  const lookups = a.cacheHits + a.cacheMisses;
  const sourceIds = [...new Set([...SOURCE_META.map((s) => s.id), ...a.sources.map((s) => s.id)])].sort();

  return (
    <div className="flex flex-col gap-6">
      <LogFilters {...filters} sources={sourceIds} events={a.events} />

      <p className="text-muted-foreground text-xs">
        {all.length} entries kept in memory since this server started ({clock.format(new Date(startedAt))}). On Vercel
        every server instance keeps its own, so this is one instance&apos;s view; the full history is in the Vercel
        project&apos;s Logs. Fetch numbers only count fetches this instance made.
      </p>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Page load time (median)"
          value={a.loadP50 !== undefined ? formatMs(a.loadP50) : "–"}
          hint={
            a.loads.length
              ? `95th percentile ${formatMs(a.loadP95!)} · ${formatCount(a.loads.length)} loads`
              : "No pages loaded yet"
          }
        >
          <Sparkline
            label="Time to load events, per page request"
            points={a.loads
              .slice(-40)
              .map((l) => ({ value: l.ms, display: formatMs(l.ms), label: clock.format(new Date(l.ts)) }))}
          />
        </StatTile>
        <StatTile
          label="Cache hit rate"
          value={lookups ? `${Math.round((a.cacheHits / lookups) * 100)}%` : "–"}
          hint={lookups ? `${plural(a.cacheHits, "hit")}, ${plural(a.cacheMisses, "upstream fetch", "upstream fetches")}` : "No source lookups yet"}
        >
          {lookups > 0 && <Meter value={a.cacheHits / lookups} label="Share of source lookups served from cache" />}
        </StatTile>
        <StatTile
          label="Upstream requests"
          value={formatCount(a.requests)}
          hint={
            a.requests
              ? `${a.requestFailures} failed (${Math.round((a.requestFailures / a.requests) * 100)}%) · ${formatBytes(a.bytes)}`
              : "None made yet"
          }
          tone={a.requestFailures ? "warning" : undefined}
        />
        <StatTile
          label="Warnings and errors"
          value={`${a.warnings} / ${a.errors}`}
          hint={a.errors ? "Errors need a look" : a.warnings ? "Warnings only" : "All quiet"}
          tone={a.errors ? "critical" : a.warnings ? "warning" : undefined}
        />
      </dl>

      <section className="flex flex-col gap-3" aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="text-lg font-semibold">
          Per source
        </h2>
        <SourceTable rows={a.sources} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="stream-heading">
        <h2 id="stream-heading" className="text-lg font-semibold">
          Log stream
        </h2>
        <LogStream entries={stream.slice(0, STREAM_LIMIT)} total={stream.length} />
      </section>
    </div>
  );
}

function LogsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}
