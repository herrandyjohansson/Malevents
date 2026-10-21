/** The in-app page for an event. Ids hold `:` and upstream characters, so they are encoded. */
export function eventHref(id: string) {
  return `/events/${encodeURIComponent(id)}`;
}
