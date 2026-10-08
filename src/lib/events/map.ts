import { EVENT_CATEGORIES, type EventCategory } from "./types";

const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, "other">, string[]> = {
  music: ["music", "musik", "konsert", "concert", "jazz", "rock", "pop", "klassisk", "opera", "dj"],
  theatre: ["theatre", "theater", "teater", "dans", "dance", "musikal", "musical", "scen", "stand-up"],
  art: ["art", "konst", "utställning", "exhibition", "galleri", "museum"],
  film: ["film", "cinema", "bio"],
  family: ["family", "familj", "barn", "kids", "children"],
  sports: ["sport", "idrott", "fotboll", "football", "hockey", "löpning", "running"],
  food: ["food", "mat", "dryck", "drink", "market", "marknad"],
  talks: ["talk", "föreläsning", "lecture", "seminar", "samtal", "workshop"],
};

/** Map free-text upstream categories onto our fixed set. */
export function toCategory(...labels: (string | undefined)[]): EventCategory {
  const haystack = labels.filter(Boolean).join(" ").toLowerCase();
  if ((EVENT_CATEGORIES as readonly string[]).includes(haystack)) return haystack as EventCategory;
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => haystack.includes(w))) return category as EventCategory;
  }
  return "other";
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
