import { CalendarRange, Map, Settings2, Sparkles, type LucideIcon } from "lucide-react";

export interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_TABS: NavTab[] = [
  { href: "/", label: "Discover", icon: Sparkles },
  { href: "/map", label: "Map", icon: Map },
  { href: "/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/admin", label: "Admin", icon: Settings2, adminOnly: true },
];

export function isActiveTab(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
