"use client";

import { Settings2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAdminMode } from "@/lib/admin-mode";
import { filterQuery } from "@/lib/events/filters";
import { useSavedEvents } from "@/lib/saved";
import { cn } from "@/lib/utils";

import { isActiveTab, NAV_TABS, type NavTab } from "./nav-config";

function visibleTabs(adminMode: boolean) {
  return NAV_TABS.filter((t) => !t.adminOnly || adminMode);
}

/** Number of saved events, as a small badge (or a dot-sized one on the phone bar). */
function SavedCount({ dot }: { dot?: boolean }) {
  const count = useSavedEvents().length;
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold tabular-nums",
        dot && "absolute -top-1 right-1.5",
      )}
    >
      <span className="sr-only">(</span>
      {count}
      <span className="sr-only"> saved)</span>
    </span>
  );
}

/** Tab links keep the shared filters, so a filter set on one tab still applies on the next. */
function useFilterQuery() {
  const query = filterQuery(new URLSearchParams(useSearchParams()));
  return (tab: NavTab) => (query && tab.sharesFilters ? `${tab.href}?${query}` : tab.href);
}

/**
 * Desktop tab bar. A pill springs to the active tab; until it has been
 * measured (and on the server) the active tab paints its own background.
 */
function DesktopTabs({
  pathname,
  adminMode,
  hrefFor = (t) => t.href,
}: {
  pathname: string | null;
  adminMode: boolean;
  hrefFor?: (tab: NavTab) => string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);
  const tabs = visibleTabs(adminMode);
  const activeHref = pathname ? tabs.find((t) => isActiveTab(pathname, t.href))?.href : undefined;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[aria-current="page"]')?.parentElement;
      setPill(active ? { x: active.offsetLeft, width: active.offsetWidth } : null);
    };
    // Fires once on observe, then whenever fonts or admin mode change the bar's size.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeHref, adminMode]);

  return (
    <ul ref={listRef} className="relative flex items-center gap-0.5 rounded-full border bg-white/[0.03] p-1">
      <li
        aria-hidden
        className={cn(
          "tab-indicator absolute top-1 left-0 h-[calc(100%-0.5rem)] rounded-full border border-white/10 bg-white/[0.08]",
          !pill && "opacity-0",
        )}
        style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.width } : undefined}
      />
      {tabs.map((tab) => {
        const { href, label, icon: Icon } = tab;
        const active = href === activeHref;
        return (
          <li key={href} className="relative">
            <Link
              href={hrefFor(tab)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                active && "text-foreground",
                active && !pill && "bg-white/[0.08]",
              )}
            >
              <Icon className="size-4" />
              <span className="max-lg:sr-only">{label}</span>
              {tab.showsSavedCount && <SavedCount />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phone tab bar, fixed to the bottom of the screen like a native app. */
function MobileTabBar({
  pathname,
  adminMode,
  hrefFor = (t) => t.href,
}: {
  pathname: string | null;
  adminMode: boolean;
  hrefFor?: (tab: NavTab) => string;
}) {
  // Admin is reached from the header on phones, to keep the bar to five tabs.
  const tabs = visibleTabs(adminMode).filter((t) => !t.adminOnly);
  return (
    <div className="glass fixed inset-x-0 bottom-0 z-[1000] border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const { href, label, icon: Icon } = tab;
          const active = pathname !== null && isActiveTab(pathname, href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={hrefFor(tab)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active && "bg-primary/20 text-primary",
                  )}
                >
                  <Icon className="size-5" />
                  {tab.showsSavedCount && <SavedCount dot />}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AdminModeToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      title={on ? "Admin mode is on (turn off)" : "Admin mode, for the site's maintainers"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition-colors",
        on ? "bg-primary/15 text-primary border-primary/50 border" : "text-muted-foreground/60 hover:text-foreground",
      )}
    >
      <ShieldCheck className="size-4" />
      <span className="sr-only">Admin mode</span>
    </button>
  );
}

/** Desktop tabs and the admin-mode switch, inside the header. */
export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminMode, setAdminMode] = useAdminMode();
  const hrefFor = useFilterQuery();

  return (
    <>
      <nav aria-label="Main" className="max-md:hidden">
        <DesktopTabs pathname={pathname} adminMode={adminMode} hrefFor={hrefFor} />
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {adminMode && (
          <Link
            href="/admin"
            aria-current={pathname?.startsWith("/admin") ? "page" : undefined}
            className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground flex size-9 items-center justify-center rounded-full border bg-white/[0.03] md:hidden"
          >
            <Settings2 className="size-4" />
            <span className="sr-only">Admin</span>
          </Link>
        )}
        <AdminModeToggle
          on={adminMode}
          onChange={(on) => {
            setAdminMode(on);
            if (!on && pathname?.startsWith("/admin")) router.push("/");
          }}
        />
      </div>
    </>
  );
}

export function HeaderNavFallback() {
  return (
    <>
      <nav aria-label="Main" className="max-md:hidden">
        <DesktopTabs pathname={null} adminMode={false} />
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <AdminModeToggle on={false} onChange={() => {}} />
      </div>
    </>
  );
}

/** Phone tabs. Rendered outside the header: its backdrop blur would trap a fixed child. */
export function MobileNav() {
  const pathname = usePathname();
  const [adminMode] = useAdminMode();
  const hrefFor = useFilterQuery();
  return (
    <nav aria-label="Main" className="md:hidden">
      <MobileTabBar pathname={pathname} adminMode={adminMode} hrefFor={hrefFor} />
    </nav>
  );
}

export function MobileNavFallback() {
  return (
    <nav aria-label="Main" className="md:hidden">
      <MobileTabBar pathname={null} adminMode={false} />
    </nav>
  );
}
