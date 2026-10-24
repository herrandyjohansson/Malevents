import { malmoLive, malmoLiveRowToEvent, type MalmoLiveRow } from "@/lib/events/sources/malmo-live";
import { planB } from "@/lib/events/sources/plan-b";
import { slagthuset, slagthusetPostToEvent, type SlagthusetPost } from "@/lib/events/sources/slagthuset";
import type { EventSource, MalmoEvent } from "@/lib/events/types";

import { runOperation } from "./openweb";
import { planBEdgeToEvent, type PlanBEdgeEvent } from "./planb-edge";

/**
 * One venue, fetched both ways. The OpenWeb side maps through the same
 * `*ToEvent` functions as the adapter where the upstream is the same, so
 * the comparison is about fetching, not parsing.
 */
export interface Venue {
  id: string;
  current: EventSource;
  /** The OpenWeb package under benchmarks/openweb/home/sites. */
  openwebSite: string;
  openweb: () => Promise<MalmoEvent[]>;
}

/** Same cutoff the adapters use: drop events that ended more than six hours ago. */
function upcoming(events: (MalmoEvent | undefined)[]) {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  return events.filter((e): e is MalmoEvent => e !== undefined && Date.parse(e.endsAt ?? e.startsAt) >= cutoff);
}

export const VENUES: Venue[] = [
  {
    id: "slagthuset",
    current: slagthuset,
    openwebSite: "slagthuset",
    openweb: async () => {
      // Same paging as the adapter: up to four pages, stopping at the first short one.
      const posts: SlagthusetPost[] = [];
      for (let page = 1; page <= 4; page++) {
        const batch = await runOperation<SlagthusetPost[]>("slagthuset", "listEvents", {
          per_page: 100,
          page,
          _fields: "id,link,title,acf,event_medium",
        });
        posts.push(...batch);
        if (batch.length < 100) break;
      }
      return upcoming(posts.map(slagthusetPostToEvent));
    },
  },
  {
    id: "malmo-live",
    current: malmoLive,
    openwebSite: "malmo-live",
    openweb: async () => {
      const rows = await runOperation<MalmoLiveRow[]>("malmo-live", "listEvents");
      return upcoming(rows.filter((row) => row.title && row.field_date_time).map(malmoLiveRowToEvent));
    },
  },
  {
    id: "plan-b",
    current: planB,
    openwebSite: "planb-malmo",
    openweb: async () => upcoming((await runOperation<PlanBEdgeEvent[]>("planb-malmo", "listEvents")).map(planBEdgeToEvent)),
  },
];
