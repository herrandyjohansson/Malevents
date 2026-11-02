import type { SourceReport } from "./types";

/**
 * Warn when rows of a listing were dropped because they couldn't be read (no
 * date or title). A site that changes part of its markup then shows a warning
 * in the admin, instead of passing as healthy with fewer events.
 */
export function reportSkipped(report: SourceReport | undefined, skipped: number, total: number) {
  if (report && skipped > 0) report.warn(`${skipped} of ${total} listings were skipped: no readable date or title`);
}
