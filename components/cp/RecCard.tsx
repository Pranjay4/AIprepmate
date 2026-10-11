"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { Recommendation } from "@/lib/cp/insights";
import { followRecommendation } from "@/lib/cp/store";
import { buttonClass } from "./ui";

export function RecCta({ rec, variant = "primary" }: { rec: Recommendation; variant?: "primary" | "secondary" }) {
  return (
    <Link href={rec.href} onClick={() => followRecommendation(rec)} className={buttonClass({ variant, size: variant === "primary" ? "md" : "sm" })}>
      {rec.cta} <ArrowRight size={14} aria-hidden />
    </Link>
  );
}

export function RecRow({ rec }: { rec: Recommendation }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm font-medium">{rec.title}</p>
        <p className="text-xs text-muted mt-1 leading-relaxed"><span className="font-medium text-foreground/80">Why:</span> {rec.reason}</p>
      </div>
      <RecCta rec={rec} variant="secondary" />
    </li>
  );
}

export function PrimaryRec({ rec }: { rec: Recommendation }) {
  return (
    <section className="rounded-xl border border-accent/30 bg-accent-soft/60 p-5 sm:p-6">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
        <Lightbulb size={13} aria-hidden /> Recommended next
      </p>
      <h2 className="text-lg font-semibold tracking-tight mt-2">{rec.title}</h2>
      <p className="text-sm text-muted mt-1.5 max-w-2xl leading-relaxed"><span className="font-medium text-foreground/80">Why this:</span> {rec.reason}</p>
      <div className="mt-4"><RecCta rec={rec} /></div>
    </section>
  );
}
