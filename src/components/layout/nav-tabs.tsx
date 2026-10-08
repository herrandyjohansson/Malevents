"use client";

import { CalendarDays, Map, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Events", icon: CalendarDays },
  { href: "/map", label: "Map", icon: Map },
  { href: "/admin", label: "Admin", icon: Settings2 },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Tabs({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="ml-auto">
      <ul className="bg-secondary/60 flex items-center gap-1 rounded-lg border p-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname !== null && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active && "bg-background text-foreground shadow-sm",
                )}
              >
                <Icon className="size-4" />
                <span className="max-sm:sr-only">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NavTabs() {
  return <Tabs pathname={usePathname()} />;
}

export function NavTabsFallback() {
  return <Tabs pathname={null} />;
}
