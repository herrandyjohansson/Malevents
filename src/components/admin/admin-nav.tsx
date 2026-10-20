"use client";

import { Activity, Database } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Sources", icon: Database },
  { href: "/admin/logs", label: "Logs", icon: Activity },
];

/** Switches between the admin's pages; source detail pages count as Sources. */
export function AdminNav() {
  const pathname = usePathname();
  const active = pathname.startsWith("/admin/logs") ? "/admin/logs" : "/admin";
  return (
    <nav aria-label="Admin" className="bg-muted/40 inline-flex gap-1 rounded-lg border p-1">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={active === href ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === href ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
