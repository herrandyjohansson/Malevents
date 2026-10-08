import "server-only";

import { SourceError } from "./http";
import { toCategory } from "./map";
import type { MalmoEvent } from "./types";

/** The subset of schema.org/Event we read. */
export interface JsonLdEvent {
  "@type": string | string[];
  "@id"?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  url?: string;
  image?: string | string[] | { url: string };
  eventAttendanceMode?: string;
  isAccessibleForFree?: boolean;
  location?: {
    name?: string;
    address?: string | { streetAddress?: string; addressLocality?: string };
  };
  offers?: JsonLdOffer | JsonLdOffer[];
  keywords?: string;
}

interface JsonLdOffer {
  price?: number | string;
  lowPrice?: number | string;
  highPrice?: number | string;
  priceCurrency?: string;
}

const LD_JSON_SCRIPT = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function isEvent(node: unknown): node is JsonLdEvent {
  if (!node || typeof node !== "object") return false;
  const type = (node as { "@type"?: unknown })["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === "string" && t.endsWith("Event"));
}

function flatten(node: unknown): unknown[] {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (node && typeof node === "object" && "@graph" in node) {
    return flatten((node as { "@graph": unknown })["@graph"]);
  }
  return [node];
}

/**
 * Pull schema.org Event objects out of a page's JSON-LD blocks. Many venue
 * and ticketing sites publish these for search engines, so this one parser
 * covers a lot of keyless sources.
 */
export function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const events: JsonLdEvent[] = [];
  for (const [, body] of html.matchAll(LD_JSON_SCRIPT)) {
    try {
      events.push(...flatten(JSON.parse(body)).filter(isEvent));
    } catch {
      // Ignore malformed blocks; other blocks on the page may still be valid.
    }
  }
  return events;
}

export async function fetchJsonLdEvents(sourceId: string, pageUrl: string, timeoutMs = 8000) {
  let res: Response;
  try {
    res = await fetch(pageUrl, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    throw new SourceError(sourceId, err instanceof Error ? err.message : "Network error");
  }
  if (!res.ok) throw new SourceError(sourceId, `HTTP ${res.status} from ${new URL(pageUrl).host}`);
  return extractJsonLdEvents(await res.text());
}

function toNumber(value: number | string | undefined) {
  if (value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export function jsonLdToEvent(sourceId: string, fallbackUrl: string, e: JsonLdEvent): MalmoEvent {
  const offers = Array.isArray(e.offers) ? e.offers : e.offers ? [e.offers] : [];
  const prices = offers
    .flatMap((o) => [toNumber(o.price), toNumber(o.lowPrice), toNumber(o.highPrice)])
    .filter((n): n is number => n !== undefined);
  const address = e.location?.address;
  const image = Array.isArray(e.image) ? e.image[0] : typeof e.image === "object" ? e.image.url : e.image;
  const url = e.url ?? fallbackUrl;

  return {
    id: `${sourceId}:${e["@id"] ?? `${url}#${e.startDate}`}`,
    sourceId,
    title: e.name,
    description: e.description,
    startsAt: e.startDate,
    endsAt: e.endDate,
    category: toCategory(e.keywords, e.name, ...[e["@type"]].flat()),
    venue: e.location?.name
      ? {
          name: e.location.name,
          address: typeof address === "string" ? address : address?.streetAddress,
          city: typeof address === "string" ? undefined : address?.addressLocality,
        }
      : undefined,
    isFree: e.isAccessibleForFree === true || (prices.length > 0 && Math.max(...prices) === 0),
    price:
      prices.length > 0 && Math.max(...prices) > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            currency: offers.find((o) => o.priceCurrency)?.priceCurrency ?? "SEK",
          }
        : undefined,
    imageUrl: image,
    url,
  };
}
