import type { CoachingTag } from "@/lib/schema";

const TAG_META: Record<CoachingTag, { label: string; tone: "good" | "warn" | "bad" }> = {
  "strong-entry": { label: "Strong entry", tone: "good" },
  "strong-point": { label: "Strong point", tone: "good" },
  "good-rebuttal": { label: "Good rebuttal", tone: "good" },
  "good-build": { label: "Good build", tone: "good" },
  "weak-example": { label: "Weak example", tone: "warn" },
  repetition: { label: "Repetition", tone: "bad" },
  "too-long": { label: "Too long", tone: "warn" },
  "unsupported-claim": { label: "Unsupported claim", tone: "bad" },
};

const TONE_CLASSES: Record<"good" | "warn" | "bad", string> = {
  good: "bg-success/10 text-success",
  warn: "bg-accent/15 text-accent",
  bad: "bg-danger/10 text-danger",
};

export function CoachingBadge({ tag }: { tag: CoachingTag }) {
  const meta = TAG_META[tag];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${TONE_CLASSES[meta.tone]}`}>
      {meta.label}
    </span>
  );
}
