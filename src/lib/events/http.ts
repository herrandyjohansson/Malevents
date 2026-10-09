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
  return (await res.json()) as T;
}

/** Like fetchJson, for HTML pages that adapters parse themselves. */
export async function fetchText(
  sourceId: string,
  url: string,
  { timeoutMs = 8000, headers }: { timeoutMs?: number; headers?: HeadersInit } = {},
): Promise<string> {
  const res = await request(sourceId, url, "text/html", timeoutMs, headers);
  return res.text();
}
