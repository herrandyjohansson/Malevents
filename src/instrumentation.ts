import type { Instrumentation } from "next";

import { DISABLED_SOURCE_IDS, LIVE_MODE } from "@/lib/events/config";
import { errorMessage, log } from "@/lib/log";

export function register() {
  log.info("server.started", {
    runtime: process.env.NEXT_RUNTIME,
    liveMode: LIVE_MODE,
    logLevel: process.env.LOG_LEVEL ?? "info",
    // Set in Vercel (EVENTS_DISABLED_SOURCES): explains a source missing from every page.
    disabledSources: DISABLED_SOURCE_IDS,
  });
}

/** Server errors Next.js captures while rendering or running actions, as structured lines. */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  log.error("request.failed", {
    // The path without its query: search params can hold what visitors typed.
    path: request.path.split("?")[0],
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    digest: typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined,
    error: errorMessage(err),
  });
};
