import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchText } from "./http";

/** A 200 response whose body starts and then breaks off with `error`. */
function breaksOff(error: unknown) {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("<html>"));
      controller.error(error);
    },
  });
  return vi.fn(async () => new Response(body));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchText, when the body breaks off", () => {
  it("reports a dropped connection as a network failure of the source", async () => {
    vi.stubGlobal("fetch", breaksOff(new TypeError("terminated")));
    await expect(fetchText("test", "https://example.com/")).rejects.toMatchObject({
      name: "SourceError",
      reason: "network",
      message: "[test] terminated",
    });
  });

  it("reports a body that doesn't finish in time as a timeout, not a bare abort", async () => {
    vi.stubGlobal("fetch", breaksOff(new DOMException("The operation was aborted due to timeout", "TimeoutError")));
    await expect(fetchText("test", "https://example.com/", { timeoutMs: 50 })).rejects.toMatchObject({
      name: "SourceError",
      reason: "timeout",
      message: "[test] The response from example.com didn't finish within 50 ms",
    });
  });
});
