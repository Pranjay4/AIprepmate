"use client";

import { Check, Star } from "lucide-react";
import type { RoleId, TimelineWeeks } from "@/lib/cp/types";
import { DAILY_MINUTES, ROLES, TIMELINES } from "@/lib/cp/content/roles";
import { ROADMAP_TEMPLATES } from "@/lib/cp/content/roadmaps";
import { budgetMinutes } from "@/lib/cp/roadmap";
import { fmtDuration } from "@/lib/cp/util";
import { Badge, cn } from "./ui";

export function RolePicker({ roles, primary, onChange }: { roles: RoleId[]; primary: RoleId | null; onChange: (roles: RoleId[], primary: RoleId | null) => void }) {
  function toggle(id: RoleId) {
    if (roles.includes(id)) {
      const next = roles.filter((r) => r !== id);
      onChange(next, primary === id ? next[0] ?? null : primary);
    } else {
      onChange([...roles, id], primary ?? id);
    }
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {ROLES.map((r) => {
        const selected = roles.includes(r.id);
        const isPrimary = primary === r.id;
        return (
          <div key={r.id} className={cn("rounded-xl border p-4 transition-colors", selected ? "border-accent bg-accent-soft/50" : "border-border bg-surface")}>
            <button type="button" onClick={() => toggle(r.id)} aria-pressed={selected} className="flex w-full items-start gap-3 text-left">
              <span className={cn("mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center", selected ? "bg-accent border-accent text-white dark:text-navy" : "border-border")}>
                {selected && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {r.name}
                  {r.depth === "starter" && <Badge>Starter content</Badge>}
                </span>
                <span className="block text-xs text-muted mt-1 leading-relaxed">{r.blurb}</span>
              </span>
            </button>
            {selected && (
              <button
                type="button" onClick={() => onChange(roles, r.id)} aria-pressed={isPrimary}
                className={cn("mt-3 ml-8 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium", isPrimary ? "bg-accent text-white dark:text-navy" : "border border-border text-muted hover:text-foreground")}
              >
                <Star size={11} aria-hidden /> {isPrimary ? "Primary — roadmap is built for this role" : "Make primary"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TimelinePicker({ value, onChange }: { value: TimelineWeeks; onChange: (v: TimelineWeeks) => void }) {
  const desc: Record<number, string> = { 2: "Sprint — essentials only", 4: "Focused — full core plan", 8: "Steady — adds weekly reviews", 12: "Thorough — reviews and regular mocks" };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {TIMELINES.map((w) => (
        <button key={w} type="button" onClick={() => onChange(w)} aria-pressed={value === w} className={cn("rounded-xl border p-4 text-left transition-colors", value === w ? "border-accent bg-accent-soft/50" : "border-border bg-surface hover:bg-surface-muted")}>
          <span className="block text-xl font-semibold tracking-tight">{w} <span className="text-sm font-medium text-muted">weeks</span></span>
          <span className="block text-xs text-muted mt-1 leading-relaxed">{desc[w]}</span>
        </button>
      ))}
    </div>
  );
}

export function MinutesPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAILY_MINUTES.map((m) => (
        <button key={m} type="button" onClick={() => onChange(m)} aria-pressed={value === m} className={cn("rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors", value === m ? "border-accent bg-accent-soft/50 text-accent" : "border-border bg-surface hover:bg-surface-muted")}>
          {fmtDuration(m)}
        </button>
      ))}
    </div>
  );
}

/** Explains how the chosen time budget compares with the role's task list. */
export function BudgetNote({ role, weeks, minutes }: { role: RoleId | null; weeks: number; minutes: number }) {
  if (!role) return null;
  const budget = budgetMinutes(weeks, minutes);
  const tpl = ROADMAP_TEMPLATES[role];
  const core = tpl.filter((t) => t.priority === "core").reduce((s, t) => s + t.durationMin, 0);
  const all = tpl.reduce((s, t) => s + t.durationMin, 0);
  const msg =
    budget < core
      ? `Core tasks alone need about ${fmtDuration(core)}. The plan will include all core tasks, so expect some days to run over — or add time.`
      : budget < all
        ? "All core tasks fit. Some optional practice and mock interviews will be left out to match your time."
        : "Everything fits, with room to spare for revision.";
  return (
    <p className="text-xs text-muted leading-relaxed">
      <span className="font-medium text-foreground">{fmtDuration(budget)} available</span> ({weeks} weeks × 6 study days × {fmtDuration(minutes)}). {msg}
    </p>
  );
}
