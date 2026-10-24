import { describe, expect, it } from "vitest";

import { isInstalled, siteInfo } from "./openweb";
import { VENUES } from "./venues";

/**
 * The OpenWeb packages load and are reachable from a server: plain HTTP
 * from Node, no browser, no login. Reads the local packages only; no network.
 */
describe.skipIf(!(await isInstalled()))("OpenWeb site packages", () => {
  it.each(VENUES.map((v) => [v.openwebSite]))("%s runs over node transport without a browser or login", async (site) => {
    const info = await siteInfo(site);
    expect(info).toMatchObject({ transport: "node", requiresBrowser: false, requiresLogin: false });
    expect(info.operations).toContain("listEvents");
  });
});
