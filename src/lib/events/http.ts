import "server-only";

import { errorMessage, log, since } from "@/lib/log";

/** Why an upstream read failed, for grouping failures in the logs. */
export type FailureReason = "timeout" | "network" | "http" | "too_large" | "invalid_json" | "other";

export class SourceError extends Error {
  constructor(
    public readonly sourceId: string,
    message: string,
    public readonly reason: FailureReason = "other",
  ) {
    super(`[${sourceId}] ${message}`);
    this.name = "SourceError";
  }
}

/**
 * Sent with every upstream request so venue sites can see who is calling
 * and how to reach us.
 */
export const USER_AGENT = "MaleventsBot/1.0 (+https://github.com/herrandyjohansson/Malevents)";

/** Largest upstream response read (10 MB); real pages and feeds are well under 2 MB. */
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

/** Read the body as text, giving up once it passes MAX_RESPONSE_BYTES. */
async function readText(sourceId: string, res: Response): Promise<{ text: string; bytes: number }> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > MAX_RESPONSE_BYTES) {
    await res.body?.cancel();
    throw new SourceError(sourceId, `Response too large (${declared} bytes)`, "too_large");
  }
  if (!res.body) return { text: "", bytes: 0 };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new SourceError(sourceId, `Response larger than ${MAX_RESPONSE_BYTES} bytes`, "too_large");
    }
    text += decoder.decode(value, { stream: true });
  }
  return { text: text + decoder.decode(), bytes };
}

/**
 * GET a URL and read the body, logging every request: one debug line on
 * success, a warning with the failure reason otherwise. `parse` runs inside
 * the same log line so invalid JSON counts as a failed request.
 */
async function get<T>(
  sourceId: string,
  url: string,
  accept: string,
  timeoutMs: number,
  headers: HeadersInit | undefined,
  parse: (text: string) => T,
): Promise<T> {
  const started = performance.now();
  let status: number | undefined;
  try {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: accept, "User-Agent": USER_AGENT, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new SourceError(sourceId, `No response from ${new URL(url).host} within ${timeoutMs} ms`, "timeout");
      }
      throw new SourceError(sourceId, err instanceof Error ? err.message : "Network error", "network");
    }
    status = res.status;
    if (!res.ok) {
      await res.body?.cancel();
      throw new SourceError(sourceId, `HTTP ${res.status} from ${new URL(url).host}`, "http");
    }
    const { text, bytes } = await readText(sourceId, res);
    const result = parse(text);
    log.debug("http.response", { source: sourceId, url, status, bytes, durationMs: since(started) });
    return result;
  } catch (err) {
    const reason = err instanceof SourceError ? err.reason : "other";
    log.warn("http.failed", { source: sourceId, url, status, reason, durationMs: since(started), error: errorMessage(err) });
    throw err;
  }
}

/**
 * Thin `fetch` wrapper for source adapters: request timeout, JSON parsing
 * and errors that name the source. Call it from inside a `"use cache"`
 * function so responses are cached per source.
 */
export async function fetchJson<T>(
  sourceId: string,
  url: string,
  { timeoutMs = 8000, headers }: { timeoutMs?: number; headers?: HeadersInit } = {},
): Promise<T> {
  return get(sourceId, url, "application/json", timeoutMs, headers, (text) => {
    try {
      // The shape is not validated here; an unexpected one fails in the adapter and shows as a source error.
      return JSON.parse(text) as T;
    } catch {
      throw new SourceError(sourceId, `Invalid JSON from ${new URL(url).host}`, "invalid_json");
    }
  });
}

/** Like fetchJson, for HTML pages that adapters parse themselves. */
export async function fetchText(
  sourceId: string,
  url: string,
  { timeoutMs = 8000, headers }: { timeoutMs?: number; headers?: HeadersInit } = {},
): Promise<string> {
  return get(sourceId, url, "text/html", timeoutMs, headers, (text) => text);
}
