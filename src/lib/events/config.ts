/**
 * Adapters with a live endpoint call it unless EVENTS_LIVE=false, which
 * makes every adapter serve its bundled fixtures (handy offline or in a
 * sandbox that can't reach the venue sites).
 */
export const LIVE_MODE = process.env.EVENTS_LIVE !== "false";

export const TIME_ZONE = "Europe/Stockholm";

/** Default per-source budget before the aggregator gives up on it. */
export const DEFAULT_SOURCE_TIMEOUT_MS = 8000;
