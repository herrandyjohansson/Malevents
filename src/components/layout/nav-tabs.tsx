"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAdminMode } from "@/lib/admin-mode";
import { cn } from "@/lib/utils";

import { isActiveTab, NAV_TABS } from "./nav-config";

function visibleTabs(adminMode: boolean) {
  return NAV_TABS.filter((t) => !t.adminOnly || adminMode);
}

/**
 * Desktop tab bar. A pill springs to the active tab; until it has been
 * measured (and on the server) the active tab paints its own background.
 */
function DesktopTabs({ pathname, adminMode }: { pathname: string | null; adminMode: boolean }) {
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
          "tab-indicator gradient-ring absolute top-1 left-0 h-[calc(100%-0.5rem)] rounded-full bg-white/[0.08] shadow-[0_0_24px_-6px] shadow-primary/50",
          !pill && "opacity-0",
        )}
        style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.width } : undefined}
      />
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <li key={href} className="relative">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                active && "text-foreground",
                active && !pill && "bg-white/[0.08]",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phone tab bar, fixed to the bottom of the screen like a native app. */
function MobileTabBar({ pathname, adminMode }: { pathname: string | null; adminMode: boolean }) {
  const tabs = visibleTabs(adminMode);
  return (
    <div className="glass fixed inset-x-0 bottom-0 z-[1000] border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname !== null && isActiveTab(pathname, href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active && "bg-primary/20 text-primary shadow-[0_0_18px_-4px] shadow-primary/60",
                  )}
                >
                  <Icon className="size-5" />
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
      title={on ? "Turn admin mode off" : "Turn admin mode on"}
      className={cn(
        "flex size-9 items-center justify-center gap-1.5 rounded-full border text-sm font-medium transition-colors lg:w-auto lg:px-3.5",
        on
          ? "border-primary/50 bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground bg-white/[0.03]",
      )}
    >
      <ShieldCheck className="size-4" />
      <span className="max-lg:sr-only">Admin</span>
    </button>
  );
}

/** Desktop tabs and the admin-mode switch, inside the header. */
export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminMode, setAdminMode] = useAdminMode();

  return (
    <>
      <nav aria-label="Main" className="max-md:hidden">
        <DesktopTabs pathname={pathname} adminMode={adminMode} />
      </nav>
      <div className="ml-auto flex items-center gap-2">
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
  return (
    <nav aria-label="Main" className="md:hidden">
      <MobileTabBar pathname={pathname} adminMode={adminMode} />
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
