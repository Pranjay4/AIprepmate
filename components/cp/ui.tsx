"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import type { Difficulty, TaskStatus } from "@/lib/cp/types";

export const cn = clsx;

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const BTN_VARIANT = {
  primary: "bg-accent text-white hover:bg-accent-strong dark:text-navy",
  secondary: "border border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
};
const BTN_SIZE = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2", lg: "text-sm px-5 py-2.5" };

type BtnStyle = { variant?: keyof typeof BTN_VARIANT; size?: keyof typeof BTN_SIZE };

export function buttonClass({ variant = "primary", size = "md" }: BtnStyle = {}, extra?: string) {
  return cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], extra);
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & BtnStyle) {
  return <button type="button" {...props} className={buttonClass({ variant, size }, className)} />;
}

export function LinkButton({ variant, size, className, ...props }: ComponentProps<typeof Link> & BtnStyle) {
  return <Link {...props} className={buttonClass({ variant, size }, className)} />;
}

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6", narrow ? "max-w-3xl" : "max-w-6xl")}>{children}</div>;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section {...props} className={cn("rounded-xl border border-border bg-surface", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ title, desc, action }: { title: string; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {desc && <p className="text-xs text-muted mt-1 leading-relaxed">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const TONE = {
  neutral: "bg-surface-muted text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};
export type Tone = keyof typeof TONE;

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap", TONE[tone], className)}>
      {children}
    </span>
  );
}

export function SampleBadge() {
  return (
    <span title="Seeded demo data, not your own activity" className="inline-flex items-center rounded border border-dashed border-border px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
      Sample
    </span>
  );
}

export function DifficultyBadge({ value }: { value: Difficulty }) {
  return <Badge tone={value === "Easy" ? "success" : value === "Medium" ? "warning" : "danger"}>{value}</Badge>;
}

export const STATUS_LABEL: Record<TaskStatus, string> = { not_started: "Not started", in_progress: "In progress", completed: "Completed" };

export function StatusBadge({ value }: { value: TaskStatus }) {
  return <Badge tone={value === "completed" ? "success" : value === "in_progress" ? "accent" : "neutral"}>{STATUS_LABEL[value]}</Badge>;
}

export function Progress({ value, tone = "accent", label }: { value: number; tone?: "accent" | "success" | "warning"; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className="h-2 w-full rounded-full bg-surface-muted overflow-hidden"
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-accent")}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Stat({ label, value, sub, icon: Icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {Icon && <Icon size={15} className="text-muted" aria-hidden />}
      </div>
      <p className="text-2xl font-semibold tracking-tight mt-1.5">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </Card>
  );
}

export function Empty({ icon: Icon, title, desc, action }: { icon: LucideIcon; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <div className="h-10 w-10 rounded-full bg-surface-muted text-muted flex items-center justify-center mb-3">
        <Icon size={18} aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const CONTROL =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium mb-1.5">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-danger mt-1">{error}</p> : hint ? <p className="text-xs text-muted mt-1">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(CONTROL, className)} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(CONTROL, "leading-relaxed", className)} />;
}
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(CONTROL, "pr-8", className)}>{children}</select>;
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg border border-border bg-surface-muted p-0.5 max-w-full overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors", value === o.value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-navy/50" onClick={onClose} aria-hidden />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cn("relative w-full bg-surface border border-border rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[92vh]", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold leading-snug">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground rounded-md p-1 -m-1">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Minimal renderer for lesson text: paragraphs, "- " lists, ~~~ code blocks and **bold**. */
export function Prose({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith("**") ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong> : part));
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "~~~") {
      const code: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "~~~") code.push(lines[i++]);
      i++;
      blocks.push(<pre key={key++}><code>{code.join("\n")}</code></pre>);
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) items.push(lines[i++].slice(2));
      blocks.push(<ul key={key++}>{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>);
    } else if (line.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("- ") && lines[i].trim() !== "~~~") para.push(lines[i++]);
      blocks.push(<p key={key++}>{inline(para.join(" "))}</p>);
    }
  }
  return <div className="cp-prose text-sm">{blocks}</div>;
}

export function Notice({ tone = "accent", children, icon: Icon }: { tone?: Tone; children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-xs leading-relaxed", TONE[tone])}>
      {Icon && <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />}
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}

export function scoreTone(pct: number): Tone {
  return pct >= 75 ? "success" : pct >= 60 ? "accent" : pct >= 40 ? "warning" : "danger";
}
