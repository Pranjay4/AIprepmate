import type { Difficulty, TopicCategory } from "@/lib/schema";
import { Timer } from "./Timer";

const CATEGORY_LABELS: Record<TopicCategory, string> = {
  "current-affairs": "Current Affairs",
  technology: "Technology",
  business: "Business",
  economics: "Economics",
  marketing: "Marketing",
  abstract: "Abstract",
  "social-issues": "Social Issues",
  custom: "Custom",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  placement: "Placement Level",
  elite: "Elite / Consulting",
};

export function TopicHeader({
  topic,
  category,
  difficulty,
  elapsedSeconds,
  totalSeconds,
}: {
  topic: string;
  category: TopicCategory;
  difficulty: Difficulty;
  elapsedSeconds: number;
  totalSeconds: number;
}) {
  return (
    <div className="border-b border-border bg-surface px-5 py-3.5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded">
            {CATEGORY_LABELS[category]}
          </span>
          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded">
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        </div>
        <h1 className="text-base font-semibold leading-snug">{topic}</h1>
      </div>
      <div className="shrink-0">
        <Timer elapsedSeconds={elapsedSeconds} totalSeconds={totalSeconds} />
      </div>
    </div>
  );
}
