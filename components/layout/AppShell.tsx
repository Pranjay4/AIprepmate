"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Map, BookOpen, ListChecks, MessagesSquare, LineChart, Building2, Settings, LogOut, Users,
  MoreHorizontal, X, FlaskConical, AlertTriangle, type LucideIcon,
} from "lucide-react";
import { useCP } from "@/lib/cp/store";
import { roleName } from "@/lib/cp/content/roles";
import { cn } from "@/components/cp/ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: ListChecks },
  { href: "/interview", label: "Mock Interview", icon: MessagesSquare },
  { href: "/gd", label: "GD Simulator", icon: Users },
];
const SECONDARY: NavItem[] = [
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/institution", label: "Institution", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];
const MOBILE_TABS = [PRIMARY[0], PRIMARY[1], PRIMARY[2], PRIMARY[3]];

const PUBLIC = ["/", "/login", "/signup"];

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={cn("rounded-lg bg-accent text-white dark:text-navy flex items-center justify-center font-bold", size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm")}>
        CP
      </span>
      <span className="font-semibold tracking-tight text-[15px]">CampusPrep</span>
    </span>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href} onClick={onClick} aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-accent-soft text-accent font-medium" : "text-muted hover:bg-surface-muted hover:text-foreground"
      )}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      {item.label}
    </Link>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-4 w-4 rounded-full border-2 border-border border-t-accent animate-spin" />
        Loading your workspace…
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, data, init, logOut, saveError } = useCP();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const isPublic = PUBLIC.includes(pathname);
  const onboarding = pathname === "/onboarding";
  const redirect = !ready
    ? null
    : !data
      ? isPublic ? null : "/login"
      : !data.profile.onboarded
        ? onboarding ? null : "/onboarding"
        : isPublic ? "/dashboard" : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!ready || redirect) return <FullScreenLoader />;
  if (!data || isPublic) return <>{children}</>;

  if (onboarding) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <Logo />
          <button type="button" onClick={() => logOut()} className="text-xs text-muted hover:text-foreground">Log out</button>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  const { profile } = data;
  const initials = profile.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-screen">
        <div className="px-5 py-5">
          <Link href="/dashboard"><Logo /></Link>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted/80">Prepare</p>
          <div className="space-y-0.5">{PRIMARY.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}</div>
          <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted/80">Track</p>
          <div className="space-y-0.5">{SECONDARY.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}</div>
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-[11px] text-muted truncate">{roleName(profile.primaryRole)}</p>
            </div>
            <button type="button" onClick={() => logOut()} aria-label="Log out" title="Log out" className="text-muted hover:text-foreground p-1.5 rounded-md hover:bg-surface-muted">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <Link href="/dashboard"><Logo size="sm" /></Link>
          <span className="text-[11px] text-muted truncate max-w-[45%]">{roleName(profile.primaryRole)}</span>
        </header>

        {profile.isDemo && (
          <div className="flex items-start gap-2 px-4 sm:px-6 lg:px-8 py-2 border-b border-border bg-accent-soft text-xs leading-relaxed">
            <FlaskConical size={13} className="text-accent shrink-0 mt-0.5" aria-hidden />
            <p>
              <strong className="font-semibold">Demo account.</strong> History marked <em className="not-italic font-medium">Sample</em> is seeded; anything you do from here is recorded as real activity on this device.{" "}
              <Link href="/settings#data" className="font-medium text-accent hover:underline whitespace-nowrap">Manage demo data</Link>
            </p>
          </div>
        )}
        {saveError && (
          <div role="alert" className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 border-b border-border bg-danger-soft text-xs">
            <AlertTriangle size={13} className="text-danger shrink-0" aria-hidden />
            {saveError}
          </div>
        )}

        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

        <nav aria-label="Mobile" className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
          {MOBILE_TABS.map((i) => {
            const active = isActive(pathname, i.href);
            const Icon = i.icon;
            return (
              <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium", active ? "text-accent" : "text-muted")}>
                <Icon size={18} aria-hidden />
                {i.label}
              </Link>
            );
          })}
          <button type="button" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium", [...PRIMARY.slice(4), ...SECONDARY].some((i) => isActive(pathname, i.href)) ? "text-accent" : "text-muted")}>
            <MoreHorizontal size={18} aria-hidden />
            More
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-navy/50" onClick={() => setMenuOpen(false)} aria-hidden />
            <div role="dialog" aria-modal="true" aria-label="More navigation" className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-surface border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile.name}</p>
                  <p className="text-[11px] text-muted truncate">{profile.email}</p>
                </div>
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1.5 text-muted"><X size={18} /></button>
              </div>
              <div className="space-y-0.5">
                {[...PRIMARY.slice(4), ...SECONDARY].map((i) => <NavLink key={i.href} item={i} pathname={pathname} onClick={() => setMenuOpen(false)} />)}
                <button type="button" onClick={() => { setMenuOpen(false); logOut(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-muted">
                  <LogOut size={16} aria-hidden /> Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
