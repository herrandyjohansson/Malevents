import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import { malmoLocalToIso, malmoToday } from "./demo-dates";

export type Page = cheerio.CheerioAPI;
export const loadHtml = (html: string): Page => cheerio.load(html);

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
/** English spellings some sites mix in, mapped onto MONTHS. */
const ENGLISH_MONTHS: Record<string, string> = { may: "maj", oct: "okt" };
const MONTH_WORD =
  "januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|" +
  "january|february|march|june|july|august|october|" +
  "jan|feb|mar|apr|may|jun|jul|aug|sept|sep|okt|oct|nov|dec";

/** "9 okt", "09 oktober 2026", "fre 9 okt 19.00", "26 november 2026 | 18:30", "10 okt 23:59". */
const SWEDISH_DATE = new RegExp(
  `(\\d{1,2})\\s+(${MONTH_WORD})\\.?(?:\\s+(\\d{4}))?(?:[\\s,|]*(?:kl\\.?\\s*)?(\\d{1,2})[.:](\\d{2}))?`,
  "i",
);

export interface ParsedDate {
  /** YYYY-MM-DD */
  ymd: string;
  /** HH:mm, when the text had a time. */
  time?: string;
  /** Where the date starts in the text, so callers can read what comes before it. */
  index: number;
}

/** Listings that omit the year mean the next such date, give or take a week of grace. */
export function inferYear(month: number, day: number, today = malmoToday()) {
  const [y, m, d] = today.split("-").map(Number);
  return Date.UTC(y, month - 1, day) < Date.UTC(y, m - 1, d - 7) ? y + 1 : y;
}

/** Find the first Swedish-style date (and time, if any) in free text. */
export function parseSwedishDate(text: string, today?: string): ParsedDate | undefined {
  const match = text.match(SWEDISH_DATE);
  if (!match || match.index === undefined) return undefined;
  const [, dayText, monthText, yearText, hour, minute] = match;
  const short = monthText.slice(0, 3).toLowerCase();
  const month = MONTHS.indexOf(ENGLISH_MONTHS[short] ?? short) + 1;
  const day = Number(dayText);
  if (month < 1 || day < 1 || day > 31) return undefined;
  const year = yearText ? Number(yearText) : inferYear(month, day, today);
  return {
    ymd: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    time: hour ? `${hour.padStart(2, "0")}:${minute}` : undefined,
    index: match.index,
  };
}

export function toIso(date: Pick<ParsedDate, "ymd" | "time">, fallbackTime = "00:00") {
  return malmoLocalToIso(date.ymd, date.time ?? fallbackTime);
}

/** Text of an element with block boundaries turned into spaces. */
export function textOf($: Page, el: AnyNode | cheerio.Cheerio<AnyNode>): string {
  const node = $(el).clone();
  node.find("script, style, noscript").remove();
  node.find("br, p, div, li, h1, h2, h3, h4, h5, h6, span, time, dd, dt").after(" ");
  return node.text().replace(/\s+/g, " ").trim();
}

export interface Card {
  /** Absolute URL of the link that identified the card. */
  href: string;
  /** The smallest element around the link that also holds the card's other details. */
  el: cheerio.Cheerio<AnyNode>;
  text: string;
}

function countDates(text: string) {
  return text.match(new RegExp(SWEDISH_DATE.source, "gi"))?.length ?? 0;
}

/**
 * Find event "cards" without depending on a theme's class names. For every
 * link matching `linkSelector`, walk up to the largest ancestor that still
 * belongs to that one event (links to no other event and holds at most one
 * date, so two dates of the same show stay two cards), then keep it if
 * `accept` likes its text. Survives most redesigns because it keys on the
 * event links themselves.
 */
export function findCards(
  $: Page,
  linkSelector: string,
  baseUrl: string,
  accept: (text: string) => boolean = () => true,
): Card[] {
  const cards = new Map<string, Card>();
  const hrefOf = (el: AnyNode) => {
    const raw = $(el).attr("href");
    if (!raw) return undefined;
    try {
      return new URL(raw, baseUrl).toString().replace(/#.*$/, "");
    } catch {
      return undefined;
    }
  };

  $(linkSelector).each((_, link) => {
    const href = hrefOf(link);
    if (!href) return;
    let el = $(link) as cheerio.Cheerio<AnyNode>;
    for (let parent = el.parent(); parent.length && !parent.is("body, main, html"); parent = parent.parent()) {
      const others = parent.find(linkSelector).toArray().some((l) => hrefOf(l) !== href);
      if (others || countDates(textOf($, parent)) > 1) break;
      el = parent;
    }
    const text = textOf($, el);
    if (!accept(text)) return;
    const key = `${href}|${text}`;
    if (!cards.has(key)) cards.set(key, { href, el, text });
  });
  return [...cards.values()];
}

/** Open Graph and meta description of a page, the most reliable bits on most sites. */
export function pageMeta($: Page) {
  const meta = (name: string) =>
    $(`meta[property="${name}"], meta[name="${name}"]`).first().attr("content")?.trim() || undefined;
  return {
    title: meta("og:title"),
    description: meta("og:description") ?? meta("description"),
    image: meta("og:image"),
  };
}

/** Run `fn` over `items` with at most `limit` in flight, to stay polite to upstreams. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
