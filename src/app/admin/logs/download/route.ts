import { recentLogs } from "@/lib/log";

/** Every entry this server instance keeps, as JSON lines, for jq or a spreadsheet. */
export function GET() {
  const { entries } = recentLogs();
  const body = entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : "");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": `attachment; filename="moevents-logs-${stamp}.jsonl"`,
      "Cache-Control": "no-store",
    },
  });
}
