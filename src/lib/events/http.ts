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
 * Thin `fetch` wrapper for source adapters: request timeout, JSON parsing
 * and errors that name the source. Call it from inside a `"use cache"`
 * function so responses are cached per source.
 */
export async function fetchJson<T>(
  sourceId: string,
  url: string,
  { timeoutMs = 8000, headers }: { timeoutMs?: number; headers?: HeadersInit } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new SourceError(sourceId, err instanceof Error ? err.message : "Network error");
  }
  if (!res.ok) {
    throw new SourceError(sourceId, `HTTP ${res.status} from ${new URL(url).host}`);
  }
  return (await res.json()) as T;
}
