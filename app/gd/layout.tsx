"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/gd", label: "Overview" },
  { href: "/gd/setup", label: "Start GD" },
  { href: "/gd/sessions", label: "Sessions" },
  { href: "/gd/performance", label: "Performance" },
  { href: "/gd/topics", label: "Topics" },
  { href: "/gd/profile", label: "GD profile" },
  { href: "/gd/settings", label: "Realism" },
];

export default function GDLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/gd/live") return <>{children}</>;
  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <p className="text-xs text-muted">
            <span className="font-semibold text-foreground">Group Discussion Simulator</span> · AI participants require an AI provider key in <code>.env.local</code>. GD history is stored separately in this browser.
          </p>
          <nav aria-label="GD simulator" className="flex gap-1 overflow-x-auto mt-3 -mb-px">
            {TABS.map((t) => {
              const active = t.href === "/gd" ? pathname === "/gd" : pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium ${active ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
