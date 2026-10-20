import "server-only";

import { errorMessage, log, since } from "@/lib/log";

/** Why an upstream read failed, for grouping failures in the logs. */
export type FailureReason = "timeout" | "network" | "http" | "too_large" | "invalid_json" | "blocked_url" | "other";

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

/** Redirects followed per request; each hop is checked like the first URL. */
const MAX_REDIRECTS = 5;

/** IPv4 literals inside a network: private, loopback, link-local, carrier-grade NAT, unspecified. */
const PRIVATE_IPV4 = /^(10|127|0)\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./;

/**
 * Only fetch public http(s) URLs. Adapters fetch detail-page links found in
 * scraped HTML, so a changed or compromised venue site must not be able to
 * point the server at itself or its internal network (SSRF). Host names are
 * not resolved: this stops links to local names and private IP literals,
 * not public names that resolve to private addresses.
 */
function assertPublicUrl(sourceId: string, url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SourceError(sourceId, "Invalid URL", "blocked_url");
  }
  const host = parsed.hostname;
  // URL has already lower-cased the host and turned decimal or hex IPv4 forms into dotted ones.
  // No dot: single-label names and every IPv6 literal, none of which a venue site links to.
  const local = !host.includes(".") || /\.(localhost|local|internal)$/.test(host) || PRIVATE_IPV4.test(host);
  if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || local) {
    throw new SourceError(sourceId, `Refused to fetch ${parsed.protocol}//${host}`, "blocked_url");
  }
  return parsed;
}

/** fetch, following redirects by hand so every hop passes assertPublicUrl. */
async function fetchPublic(sourceId: string, url: string, init: RequestInit) {
  let target = assertPublicUrl(sourceId, url);
  for (let hop = 0; ; hop++) {
    const res = await fetch(target, { ...init, redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return res;
    await res.body?.cancel();
    if (hop === MAX_REDIRECTS) throw new SourceError(sourceId, `Too many redirects from ${target.host}`, "http");
    target = assertPublicUrl(sourceId, new URL(location, target).toString());
  }
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
      res = await fetchPublic(sourceId, url, {
        headers: { Accept: accept, "User-Agent": USER_AGENT, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err instanceof SourceError) throw err;
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
