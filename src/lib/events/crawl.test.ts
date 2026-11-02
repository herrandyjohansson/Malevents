import { describe, expect, it, vi } from "vitest";

import { crawlListing } from "./crawl";

// Each "page" is its own URL, so parse can tell them apart without a network.
vi.mock("./http", () => ({ fetchText: vi.fn(async (_sourceId: string, url: string) => url) }));
vi.mock("./fetch-page", () => ({ fetchDetailPage: vi.fn() }));

function crawl(parse: (html: string) => string[], warnings: string[] = []) {
  return crawlListing({
    sourceId: "test",
    report: { warn: (message) => warnings.push(message) },
    maxPages: 5,
    pageUrl: (page) => `page-${page}`,
    parse,
    hasNextPage: () => true,
  });
}

describe("crawlListing", () => {
  it("keeps the pages read so far when a later page can't be parsed, and says so", async () => {
    const warnings: string[] = [];
    const items = await crawl((html) => {
      if (html === "page-2") throw new Error("Unexpected markup");
      return [html];
    }, warnings);
    expect(items).toEqual(["page-0", "page-1"]);
    expect(warnings).toEqual(["Listing page 3 couldn't be read, so the listing stops there: Unexpected markup"]);
  });

  it("still fails the source when the first page can't be parsed", async () => {
    await expect(
      crawl(() => {
        throw new Error("Unexpected markup");
      }),
    ).rejects.toThrow("Unexpected markup");
  });
});
