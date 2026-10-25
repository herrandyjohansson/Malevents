import MiniSearch from "minisearch";
import type { EventCategory } from "./types";

export interface SearchDocument {
  id: string;
  kind: "event" | "venue";
  title: string;
  description: string;
  venueName: string;
  subtitle: string;
  href: string;
  imageUrl?: string;
  category?: EventCategory;
  startsAt?: string;
  price?: string;
  status?: "Cancelled" | "Sold out";
  upcoming?: { title: string; href: string; date: string }[];
}

function normalizeTerm(term: string) {
  return term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function createEventSearch(documents: SearchDocument[]) {
  const index = new MiniSearch<SearchDocument>({
    fields: ["title", "venueName", "description"],
    processTerm: normalizeTerm,
    searchOptions: {
      boost: { title: 5, venueName: 2 },
      prefix: true,
      fuzzy: (term) => term.length > 3 ? 0.2 : false,
      combineWith: "AND",
    },
  });
  index.addAll(documents);
  return { index, documents: new Map(documents.map((document) => [document.id, document])) };
}

export function searchEvents(search: ReturnType<typeof createEventSearch>, query: string): SearchDocument[] {
  const text = query.trim().slice(0, 100);
  if (!text) return [];
  return search.index.search(text).flatMap((result) => {
    const document = search.documents.get(result.id);
    return document ? [document] : [];
  });
}
