import type { EvaluationScores } from "@/lib/schema";

const DIMENSIONS: { key: keyof EvaluationScores; label: string; max: number }[] = [
  { key: "content", label: "Content Quality", max: 20 },
  { key: "structure", label: "Structure", max: 15 },
  { key: "clarity", label: "Clarity of Thought", max: 15 },
  { key: "communication", label: "Communication", max: 15 },
  { key: "businessThinking", label: "Business / MBA Thinking", max: 10 },
  { key: "listeningBuilding", label: "Listening & Building", max: 10 },
  { key: "leadership", label: "Leadership", max: 10 },
  { key: "participation", label: "Participation", max: 5 },
];

function scoreColor(ratio: number) {
  if (ratio >= 0.75) return "bg-success";
  if (ratio >= 0.5) return "bg-accent";
  return "bg-danger";
}

export function ScoreBreakdown({ overallScore, scores }: { overallScore: number; scores: EvaluationScores }) {
  return (
    <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-start">
      <div className="rounded-2xl bg-navy text-white px-8 py-7 text-center sm:min-w-48">
        <p className="text-xs uppercase tracking-wide text-white/50 font-medium">Overall Score</p>
        <p className="text-5xl font-bold mt-2 tracking-tight">
          {overallScore}
          <span className="text-xl text-white/40 font-medium">/100</span>
        </p>
      </div>
      <div className="flex-1 space-y-3">
        {DIMENSIONS.map((d) => {
          const value = scores[d.key];
          const ratio = value / d.max;
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{d.label}</span>
                <span className="text-muted tabular-nums">
                  {value}/{d.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(ratio)}`} style={{ width: `${ratio * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
