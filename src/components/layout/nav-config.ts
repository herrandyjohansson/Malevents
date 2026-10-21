import { Building2, Heart, Map, Moon, Settings2, Sparkles, type LucideIcon } from "lucide-react";

export interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Carries the shared event filters over when you switch to it. */
  sharesFilters?: boolean;
  /** Shows how many events are saved in this browser. */
  showsSavedCount?: boolean;
}

// Tonight first: it answers the most common question. The week view and the
// month calendar live inside Discover (`?when=week`, `?view=calendar`).
export const NAV_TABS: NavTab[] = [
  { href: "/tonight", label: "Tonight", icon: Moon },
  { href: "/", label: "Discover", icon: Sparkles, sharesFilters: true },
  { href: "/map", label: "Map", icon: Map, sharesFilters: true },
  { href: "/venues", label: "Venues", icon: Building2 },
  { href: "/saved", label: "Saved", icon: Heart, showsSavedCount: true },
  { href: "/admin", label: "Admin", icon: Settings2, adminOnly: true },
];

export function isActiveTab(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
