import { CalendarRange, Columns3, Map, Settings2, Sparkles, type LucideIcon } from "lucide-react";

export interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Carries the shared event filters over when you switch to it. */
  sharesFilters?: boolean;
}

export const NAV_TABS: NavTab[] = [
  { href: "/", label: "Discover", icon: Sparkles, sharesFilters: true },
  { href: "/map", label: "Map", icon: Map, sharesFilters: true },
  { href: "/calendar", label: "Calendar", icon: CalendarRange, sharesFilters: true },
  { href: "/week", label: "Week", icon: Columns3 },
  { href: "/admin", label: "Admin", icon: Settings2, adminOnly: true },
];

export function isActiveTab(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
