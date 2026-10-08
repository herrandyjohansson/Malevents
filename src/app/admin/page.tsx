import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { RefreshAllButton, RefreshSourceButton, SourceToggle } from "@/components/admin/source-controls";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllEvents } from "@/lib/events/aggregate";
import { isUpcoming } from "@/lib/events/filters";
import { formatRelative } from "@/lib/events/format";
import { SOURCE_META } from "@/lib/events/sources";
import { hasCoordinates } from "@/lib/events/venues";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-medium">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Event sources</h1>
          <p className="text-muted-foreground max-w-2xl">
            Check each API&apos;s health, refresh its cached data, or switch it off without a deploy.
          </p>
        </div>
        <RefreshAllButton />
      </section>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminOverview />
      </Suspense>
      <AddSourceHelp />
    </main>
  );
}

async function AdminOverview() {
  await connection();
  const { events, sources } = await getAllEvents();
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
                  <TableCell>
                    <SourceToggle id={s.id} name={s.name} enabled={s.enabled} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <RefreshSourceButton id={s.id} name={s.name} />
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
