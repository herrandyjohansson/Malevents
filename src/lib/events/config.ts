/**
 * Adapters with a live endpoint call it unless EVENTS_LIVE=false, which
 * makes every adapter serve its bundled fixtures (handy offline or in a
 * sandbox that can't reach the venue sites).
 */
export const LIVE_MODE = process.env.EVENTS_LIVE !== "false";

/**
 * Sources switched off for visitors: EVENTS_DISABLED_SOURCES, a comma-separated
 * list of source ids (`malmo-stad,hypnos`). It is set in the Vercel project's
 * environment variables and takes effect on the next deployment. The site has
 * no switch for it, so nobody can change it from a browser.
 */
export const DISABLED_SOURCE_IDS = parseIdList(process.env.EVENTS_DISABLED_SOURCES);

/** Ids from a comma- or space-separated list, without blanks or repeats. */
export function parseIdList(value: string | undefined) {
  return [...new Set((value ?? "").split(/[\s,]+/).filter(Boolean))];
}

export const TIME_ZONE = "Europe/Stockholm";

/** Default per-source budget before the aggregator gives up on it. */
export const DEFAULT_SOURCE_TIMEOUT_MS = 8000;
