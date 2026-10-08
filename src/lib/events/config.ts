/**
 * Adapters serve bundled demo fixtures unless EVENTS_LIVE=true, in which
 * case adapters that have a live endpoint call it instead.
 */
export const LIVE_MODE = process.env.EVENTS_LIVE === "true";

export const TIME_ZONE = "Europe/Stockholm";

/** Default per-source budget before the aggregator gives up on it. */
export const DEFAULT_SOURCE_TIMEOUT_MS = 8000;
