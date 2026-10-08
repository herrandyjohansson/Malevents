"use client";

import { CalendarDays, Map, Settings2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAdminMode } from "@/lib/admin-mode";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Events", icon: CalendarDays },
  { href: "/map", label: "Map", icon: Map },
  { href: "/admin", label: "Admin", icon: Settings2, adminOnly: true },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Tabs({ pathname, adminMode }: { pathname: string | null; adminMode: boolean }) {
  return (
    <ul className="bg-secondary/60 flex items-center gap-1 rounded-lg border p-1">
      {TABS.filter((t) => !("adminOnly" in t) || adminMode).map(({ href, label, icon: Icon }) => {
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
  );
}

function AdminModeToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      title={on ? "Turn admin mode off" : "Turn admin mode on"}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
        on
          ? "border-primary/50 bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground bg-secondary/60",
      )}
    >
      <ShieldCheck className="size-4" />
      <span className="max-sm:sr-only">Admin mode</span>
    </button>
  );
}

export function NavTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminMode, setAdminMode] = useAdminMode();

  return (
    <nav aria-label="Main" className="ml-auto flex items-center gap-2">
      <Tabs pathname={pathname} adminMode={adminMode} />
      <AdminModeToggle
        on={adminMode}
        onChange={(on) => {
          setAdminMode(on);
          if (!on && pathname?.startsWith("/admin")) router.push("/");
        }}
      />
    </nav>
  );
}

export function NavTabsFallback() {
  return (
    <nav aria-label="Main" className="ml-auto flex items-center gap-2">
      <Tabs pathname={null} adminMode={false} />
      <AdminModeToggle on={false} onChange={() => {}} />
    </nav>
  );
}
