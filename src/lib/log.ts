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
 *
 * Every entry, at any level, is also kept in a ring buffer in memory for the
 * admin's Logs page (see recentLogs).
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
export type LogLevel = keyof typeof LEVELS;
type Level = LogLevel;
type Fields = Record<string, unknown>;

export interface LogEntry {
  ts: string;
  level: LogLevel;
  event: string;
  [field: string]: unknown;
}

/** Entries kept for the Logs page; the oldest are dropped first. */
const BUFFER_SIZE = 2000;

interface LogBuffer {
  startedAt: string;
  entries: LogEntry[];
}

// On globalThis because each route bundle gets its own copy of this module;
// one buffer per server process collects them all.
const BUFFER_KEY = Symbol.for("malevents.logBuffer");
const globalStore = globalThis as typeof globalThis & { [BUFFER_KEY]?: LogBuffer };
const buffer = (globalStore[BUFFER_KEY] ??= { startedAt: new Date().toISOString(), entries: [] });

/**
 * The entries logged by this server process, oldest first, at every level
 * whatever LOG_LEVEL says. In memory only: lost on restart, and on serverless
 * hosts each instance has its own.
 */
export function recentLogs(): { startedAt: string; entries: readonly LogEntry[] } {
  return buffer;
}

/** Longest string value written; longer ones (error messages with HTML in them) are cut. */
const MAX_STRING = 500;

const minLevel = LEVELS[process.env.LOG_LEVEL as Level] ?? LEVELS.info;

function replacer(_key: string, value: unknown) {
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === "string" && value.length > MAX_STRING) return `${value.slice(0, MAX_STRING)}…`;
  return value;
}

function write(level: Level, event: string, fields: Fields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields }, replacer);
  // Stored as parsed back from the line, so the buffer holds exactly what was written.
  buffer.entries.push(JSON.parse(line));
  if (buffer.entries.length > BUFFER_SIZE) buffer.entries.splice(0, buffer.entries.length - BUFFER_SIZE);
  if (LEVELS[level] < minLevel) return;
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
