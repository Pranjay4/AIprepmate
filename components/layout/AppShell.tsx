"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Timer,
  History,
  LineChart,
  BookOpen,
  Settings,
  UserRound,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/setup", label: "Start GD", icon: Timer },
  { href: "/sessions", label: "Previous Sessions", icon: History },
  { href: "/performance", label: "Performance", icon: LineChart },
  { href: "/topics", label: "Topics", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-navy text-white/90">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center font-serif text-navy font-bold text-lg">
              G
            </div>
            <div>
              <div className="font-semibold tracking-tight text-sm">GDiscuss</div>
              <div className="text-[11px] text-white/50">Placement GD Simulator</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40">
          Practice like it&apos;s the real panel.
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border bg-navy text-white">
          <div className="h-6 w-6 rounded bg-accent flex items-center justify-center font-serif text-navy font-bold text-xs">
            G
          </div>
          <span className="font-semibold text-sm">GDiscuss</span>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
