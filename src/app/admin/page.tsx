import { ChevronRight, Lock, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllEvents } from "@/lib/events/aggregate";
import { DISABLED_SOURCE_IDS } from "@/lib/events/config";
import { isUpcoming } from "@/lib/events/filters";
import { formatRelative } from "@/lib/events/format";
import { getSource, SOURCE_META } from "@/lib/events/sources";
import { hasCoordinates } from "@/lib/events/venues";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-10 sm:px-6">
      <PageHeader
        title="Event sources"
        description="Each API's health and cached data, read-only. Sources are switched on and off in Vercel."
      >
        <AdminNav />
      </PageHeader>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminOverview />
      </Suspense>
      <div className="grid gap-4 lg:grid-cols-2">
        <ManagedInVercel />
        <AddSourceHelp />
      </div>
    </main>
  );
}

async function AdminOverview() {
  await connection();
  const { events, sources } = await getAllEvents("complete");
  const now = new Date();
  const upcoming = events.filter((e) => isUpcoming(e, now));
  const meta = new Map(SOURCE_META.map((m) => [m.id, m]));

  const stats = [
    { label: "Active sources", value: `${sources.filter((s) => s.enabled).length} / ${sources.length}` },
    { label: "Upcoming events", value: upcoming.length },
    {
      label: "Failing sources",
      value: sources.filter((s) => s.state === "error").length,
      tone: sources.some((s) => s.state === "error") ? "text-destructive" : undefined,
    },
    {
      label: "Missing location",
      value: upcoming.filter((e) => !hasCoordinates(e)).length,
      hint: "Not shown on the map",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardContent className="px-4">
              <dt className="text-muted-foreground text-xs font-medium">{s.label}</dt>
              <dd className={`text-2xl font-semibold tabular-nums ${s.tone ?? ""}`}>{s.value}</dd>
              {s.hint && <p className="text-muted-foreground text-xs">{s.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </dl>

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead>Last fetched</TableHead>
              <TableHead className="text-right">Response</TableHead>
              <TableHead>Cache</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((s) => {
              const m = meta.get(s.id)!;
              return (
                <TableRow key={s.id}>
                  <TableCell className="max-w-80 pl-4 whitespace-normal">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/sources/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {m.kind}
                      </Badge>
                      {m.demo && (
                        <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
                          demo
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{m.description}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge state={s.state} />
                      {s.error && (
                        <span className="text-destructive max-w-48 truncate text-xs" title={s.error}>
                          {s.error}
                        </span>
                      )}
                      {s.warnings && (
                        <span className="text-warning text-xs" title={s.warnings.join("\n")}>
                          {s.warnings.length === 1 ? "1 warning" : `${s.warnings.length} warnings`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.state === "ok" ? s.count : "–"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.fetchedAt ? (
                      <time dateTime={s.fetchedAt} title={s.fetchedAt}>
                        {formatRelative(s.fetchedAt, now)}
                      </time>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {s.durationMs !== undefined ? `${s.durationMs} ms` : "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.cacheProfile}</TableCell>
                  <TableCell className={s.enabled ? undefined : "text-muted-foreground"}>
                    {s.enabled ? "On" : DISABLED_SOURCE_IDS.includes(s.id) ? "Off in Vercel" : "Off (demo)"}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/sources/${s.id}`}
                        aria-label={`View ${s.name}`}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-md"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/**
 * The admin has no login, so it changes nothing: switching sources and
 * flushing caches are done in Vercel, where only the project's members can.
 */
function ManagedInVercel() {
  const unknown = DISABLED_SOURCE_IDS.filter((id) => !getSource(id));
  const code = "text-foreground font-mono text-xs";
  return (
    <Card className="bg-card/50 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="size-4" />
          Changes are made in Vercel
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <p>
            Switch a source off: add its id to <code className={code}>EVENTS_DISABLED_SOURCES</code> (comma-separated)
            under Settings → Environment Variables, then redeploy. Now:{" "}
            <code className={code}>{DISABLED_SOURCE_IDS.join(",") || "not set"}</code>.
          </p>
          <p>
            Fetch fresh data: <code className={code}>vercel cache invalidate --tag events</code> for every source, or{" "}
            <code className={code}>--tag events:&lt;id&gt;</code> for one.
          </p>
          {unknown.length > 0 && (
            <p className="text-warning">
              Not a source id, so ignored: <code className="font-mono text-xs">{unknown.join(", ")}</code>
            </p>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function AddSourceHelp() {
  return (
    <Card className="bg-card/50 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          Adding a source
        </CardTitle>
        <CardDescription>
          Sources are code, so they&apos;re reviewed and typed. Add an adapter in{" "}
          <code className="text-foreground font-mono text-xs">src/lib/events/sources/</code> that maps the API
          into the shared event format, then register it in{" "}
          <code className="text-foreground font-mono text-xs">sources/index.ts</code>. It shows up here with
          caching, timeouts and health checks already applied.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
