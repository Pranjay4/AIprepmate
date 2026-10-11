"use client";

import Link from "next/link";
import { TOPIC_BANK } from "@/lib/topics";
import type { Difficulty, TopicCategory } from "@/lib/schema";

const CATEGORY_LABELS: Record<Exclude<TopicCategory, "custom">, string> = {
  "current-affairs": "Current Affairs",
  technology: "Technology",
  business: "Business",
  economics: "Economics",
  marketing: "Marketing",
  abstract: "Abstract",
  "social-issues": "Social Issues",
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-info/10 text-info",
  placement: "bg-accent/15 text-accent",
  elite: "bg-danger/10 text-danger",
};

export default function TopicsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 pb-16">
      <div>
        <p className="text-sm text-muted font-medium">Topics</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Topic bank</h1>
        <p className="text-sm text-muted mt-1">
          A sample of the topics GDiscuss can generate — the live topic for your GD is freshly generated each time,
          calibrated to your chosen category and difficulty.
        </p>
      </div>

      {(Object.keys(TOPIC_BANK) as Exclude<TopicCategory, "custom">[]).map((category) => (
        <section key={category}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">{CATEGORY_LABELS[category]}</h2>
            <Link href={`/gd/setup?category=${category}`} className="text-xs font-medium text-accent hover:underline">
              Start a GD in this category &rarr;
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {TOPIC_BANK[category].map((t, i) => (
              <div key={i} className="px-4 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">{t.topic}</p>
                  <p className="text-xs text-muted mt-1">{t.context}</p>
                </div>
                <span className={`shrink-0 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded ${DIFFICULTY_TONE[t.difficulty]}`}>
                  {t.difficulty}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
