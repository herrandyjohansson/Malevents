/**
 * Structured server logs: one JSON object per line, so they can be filtered
 * with `jq` locally and searched in Vercel's runtime logs. Every line has
 * `ts`, `level` and `event` (a dotted name such as "http.response") plus its
 * own fields.
 *
 * LOG_LEVEL (debug | info | warn | error, default info) sets the lowest level
 * written; "debug" adds one line per upstream request.
 *
 * Log events and numbers, not page content or visitor input. Values go
 * through JSON.stringify, so newlines in upstream text can't forge lines.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;
type Fields = Record<string, unknown>;

/** Longest string value written; longer ones (error messages with HTML in them) are cut. */
const MAX_STRING = 500;

const minLevel = LEVELS[process.env.LOG_LEVEL as Level] ?? LEVELS.info;

function replacer(_key: string, value: unknown) {
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === "string" && value.length > MAX_STRING) return `${value.slice(0, MAX_STRING)}…`;
  return value;
}

function write(level: Level, event: string, fields: Fields = {}) {
  if (LEVELS[level] < minLevel) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields }, replacer);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Fields) => write("debug", event, fields),
  info: (event: string, fields?: Fields) => write("info", event, fields),
  warn: (event: string, fields?: Fields) => write("warn", event, fields),
  error: (event: string, fields?: Fields) => write("error", event, fields),
};

/** Milliseconds since `started` (a `performance.now()` value), rounded. */
export function since(started: number) {
  return Math.round(performance.now() - started);
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}
