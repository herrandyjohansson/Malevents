import { ArrowLeft, Check, CircleAlert, ExternalLink, MapPinOff } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { RefreshSourceButton, SourceToggle } from "@/components/admin/source-controls";
import { StatusBadge } from "@/components/admin/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadSource } from "@/lib/events/aggregate";
import { DEFAULT_SOURCE_TIMEOUT_MS } from "@/lib/events/config";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatEventDate, formatPrice, formatRelative } from "@/lib/events/format";
import { getSourceSettings } from "@/lib/events/settings";
import { getSource, isEnabledByDefault } from "@/lib/events/sources";
import { hasCoordinates } from "@/lib/events/venues";

export default function SourcePage({ params }: PageProps<"/admin/sources/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All sources
      </Link>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <SourceDetail params={params} />
      </Suspense>
    </main>
  );
}

async function SourceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = getSource(id);
  if (!source) notFound();

  await connection();
  const settings = await getSourceSettings();
  const enabled = settings[id]?.enabled ?? isEnabledByDefault(source);
  // Always load for the preview, even when the source is switched off for visitors.
  const { status, events } = await loadSource(source, true);
  const now = new Date();

  const facts = [
    { label: "Adapter", value: <code className="font-mono text-xs">{source.kind}</code> },
    {
      label: "Endpoint",
      value: source.endpoint ? (
        <a href={source.endpoint} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {new URL(source.endpoint).host}
        </a>
      ) : (
        <span className="text-muted-foreground">Fixture data</span>
      ),
    },
    { label: "Cache", value: source.cacheProfile ?? "hours" },
    { label: "Timeout", value: `${(source.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS) / 1000} s` },
    { label: "Last fetched", value: status.fetchedAt ? formatRelative(status.fetchedAt, now) : "–" },
    { label: "Response", value: status.durationMs !== undefined ? `${status.durationMs} ms` : "–" },
  ];
  const unplaced = events.filter((e) => !hasCoordinates(e)).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{source.name}</h1>
            <StatusBadge state={enabled ? status.state : "disabled"} />
          </div>
          <p className="text-muted-foreground max-w-2xl">{source.description}</p>
          <a
            href={source.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex w-fit items-center gap-1 text-sm hover:underline"
          >
            {new URL(source.homepage).host}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="bg-card flex items-center gap-3 rounded-lg border px-3 py-1.5">
          <span className="text-sm">Show to visitors</span>
          <SourceToggle id={source.id} name={source.name} enabled={enabled} />
          <RefreshSourceButton id={source.id} name={source.name} />
        </div>
      </section>

      {status.error && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <CircleAlert className="text-destructive" />
          <AlertTitle>Last fetch failed</AlertTitle>
          <AlertDescription className="font-mono text-xs">{status.error}</AlertDescription>
        </Alert>
      )}

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {facts.map((f) => (
          <div key={f.label} className="bg-card rounded-lg border px-4 py-3">
            <dt className="text-muted-foreground text-xs">{f.label}</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex items-center justify-between border-b py-4">
          <CardTitle className="text-base">Normalized events ({events.length})</CardTitle>
          {unplaced > 0 && (
            <span className="text-warning flex items-center gap-1.5 text-xs">
              <MapPinOff className="size-3.5" />
              {unplaced} without location
            </span>
          )}
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Title</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Map</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="pr-4">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="max-w-72 truncate pl-4 font-medium">
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {e.title}
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatEventDate(e)}</TableCell>
                <TableCell className="text-muted-foreground max-w-56 truncate">{e.venue?.name ?? "–"}</TableCell>
                <TableCell>
                  {hasCoordinates(e) ? (
                    <Check className="text-success size-4" aria-label="Has coordinates" />
                  ) : (
                    <MapPinOff className="text-warning size-4" aria-label="No coordinates" />
                  )}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: CATEGORY_COLORS[e.category] }} />
                    {CATEGORY_LABELS[e.category]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground pr-4">{formatPrice(e) ?? "–"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {events[0] && (
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Sample record</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-background overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed">
              {JSON.stringify(events[0], null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
