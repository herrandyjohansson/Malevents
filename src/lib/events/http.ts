import "server-only";

export class SourceError extends Error {
  constructor(
    public readonly sourceId: string,
    message: string,
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
async function readText(sourceId: string, res: Response): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > MAX_RESPONSE_BYTES) {
    await res.body?.cancel();
    throw new SourceError(sourceId, `Response too large (${declared} bytes)`);
  }
  if (!res.body) return "";
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
      throw new SourceError(sourceId, `Response larger than ${MAX_RESPONSE_BYTES} bytes`);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function request(sourceId: string, url: string, accept: string, timeoutMs: number, headers?: HeadersInit) {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: accept, "User-Agent": USER_AGENT, ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new SourceError(sourceId, err instanceof Error ? err.message : "Network error");
  }
  if (!res.ok) {
    throw new SourceError(sourceId, `HTTP ${res.status} from ${new URL(url).host}`);
  }
  return res;
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
  const res = await request(sourceId, url, "application/json", timeoutMs, headers);
  const text = await readText(sourceId, res);
  try {
    // The shape is not validated here; an unexpected one fails in the adapter and shows as a source error.
    return JSON.parse(text) as T;
  } catch {
    throw new SourceError(sourceId, `Invalid JSON from ${new URL(url).host}`);
  }
}

/** Like fetchJson, for HTML pages that adapters parse themselves. */
export async function fetchText(
  sourceId: string,
  url: string,
  { timeoutMs = 8000, headers }: { timeoutMs?: number; headers?: HeadersInit } = {},
): Promise<string> {
  const res = await request(sourceId, url, "text/html", timeoutMs, headers);
  return readText(sourceId, res);
}
