import { EVENT_CATEGORIES, type EventCategory, type MalmoEvent } from "./types";

// "theatre" is shown as Stage: theatre, musicals, opera, dance and comedy.
const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, "other">, string[]> = {
  music: [
    "music", "musik", "konsert", "concert", "jazz", "rock", "pop", "klassisk", "symfoni", "orkester",
    "requiem", "kören", "körsång", "dansband", "trio", "kvartett", "sing-a-long",
  ],
  theatre: [
    "theatre", "theater", "teater", "dans", "dance", "musikal", "musical", "opera", "operett", "balett",
    "ballet", "stand-up", "standup", "stand up", "comedy", "komedi", "improv", "föreställning",
  ],
  nightlife: ["klubb", "club", "party", "halloween", "night", "nattklubb", "rave", "disco", "dj"],
  art: ["art", "konst", "utställning", "exhibition", "galleri", "museum"],
  film: ["film", "cinema", "bio"],
  family: ["family", "familj", "barn", "kids", "children"],
  sports: [
    "sport", "idrott", "fotboll", "football", "hockey", "löpning", "running", "galopp", "trav",
    "starkaste",
  ],
  food: ["food", "mat", "dryck", "drink", "market", "marknad", "provning", "wine", "middag", "dinner", "brunch"],
  talks: ["talk", "föreläsning", "lecture", "seminar", "samtal", "workshop", "visning", "guidad", "guided"],
};

/**
 * Keywords this short only match at the start of a word, so "art" doesn't hit
 * "Mozart", "party" or "start", nor "mat" "format". Longer keywords match
 * anywhere, which catches Swedish compounds such as "julkonsert" or "barnteater".
 */
const SHORT_KEYWORD_LENGTH = 4;

function keywordMatcher(word: string) {
  if (word.length > SHORT_KEYWORD_LENGTH) return (text: string) => text.includes(word);
  const atWordStart = new RegExp(`(?:^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u");
  return (text: string) => atWordStart.test(text);
}

const CATEGORY_MATCHERS = Object.entries(CATEGORY_KEYWORDS).flatMap(([category, words]) =>
  words.map((word) => ({ category: category as EventCategory, word, matches: keywordMatcher(word) })),
);

/**
 * Map free-text upstream categories onto our fixed set: an exact category
 * name, otherwise the category of the longest keyword found in the text
 * (ties go to CATEGORY_KEYWORDS order), otherwise "other". Longest wins so
 * "musical" beats "music" and "dansband" beats "dans".
 */
export function toCategory(...labels: (string | undefined)[]): EventCategory {
  const haystack = labels
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    // Words that contain a keyword but mean something else ("Operation: Mindcrime" is not an opera).
    .replace(/operation/g, " ");
  if ((EVENT_CATEGORIES as readonly string[]).includes(haystack)) return haystack as EventCategory;
  let best: { category: EventCategory; length: number } | undefined;
  for (const { category, word, matches } of CATEGORY_MATCHERS) {
    if ((!best || word.length > best.length) && matches(haystack)) best = { category, length: word.length };
  }
  return best?.category ?? "other";
}

/**
 * What a venue mostly hosts, for events whose own text names no category:
 * an untitled evening at a concert hall is a concert. Keys are lower-case
 * venue names as the upstreams write them.
 */
const VENUE_CATEGORIES: Record<string, EventCategory> = {
  "malmö live konserthus": "music",
  babel: "music",
  "grand malmö": "music",
  "medley – musik": "music",
  "slagthusets teater": "theatre",
  "fat daves": "theatre",
  "jägersro galopp": "sports",
  "jägersro trav": "sports",
  "hyllie bryggeri": "food",
  "hyllie bryggeri ab": "food",
  zymologi: "food",
};

/** Cancelled in Swedish or English, as upstreams put it in titles and status notes. */
const CANCELLED = /\b(inställ[td]|avbokad|cancel+ed)\b/i;
/** "Band + support act" or "Band / Band / Band", the way gig listings name a bill. */
const DOUBLE_BILL = /\S \+ \S|\S \/ \S|förband|support:/i;

/**
 * Last pass over every event, whatever the source: flag cancellations, and
 * give an "other" event a category from its venue or the shape of its title.
 */
export function refineEvent(event: MalmoEvent): MalmoEvent {
  const cancelled = CANCELLED.test([event.title, ...(event.notes ?? [])].join(" "));
  let category = event.category;
  if (category === "other") {
    category =
      VENUE_CATEGORIES[event.venue?.name.trim().toLowerCase() ?? ""] ?? (DOUBLE_BILL.test(event.title) ? "music" : "other");
  }
  if (!cancelled && category === event.category) return event;
  return { ...event, category, ...(cancelled ? { cancelled: true as const, soldOut: undefined } : {}) };
}

/** Parse Swedish-style price text such as "Gratis", "120 kr" or "150–350 kr". */
export function parsePriceText(text: string | undefined) {
  if (!text) return { isFree: false };
  if (/gratis|fri entré|free/i.test(text)) return { isFree: true };
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return { isFree: false };
  return {
    isFree: false,
    price: { min: Math.min(...numbers), max: Math.max(...numbers), currency: "SEK" },
  };
}

/** The value if it is an absolute http(s) URL, otherwise undefined. */
export function httpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Upstream links end up in href and src attributes, so only http(s) URLs are
 * kept: a scraped "javascript:" or "data:" link is dropped (the event link
 * falls back to the source's homepage) instead of relying on React to block it.
 */
export function withSafeLinks(event: MalmoEvent, fallbackUrl: string): MalmoEvent {
  return {
    ...event,
    url: httpUrl(event.url) ?? fallbackUrl,
    ticketUrl: httpUrl(event.ticketUrl),
    imageUrl: httpUrl(event.imageUrl),
  };
}
