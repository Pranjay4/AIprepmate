import type { InterventionRewrite } from "@/lib/schema";

export function ImprovedAnswers({ rewrites }: { rewrites: InterventionRewrite[] }) {
  if (rewrites.length === 0) {
    return <p className="text-sm text-muted">No substantial interventions were flagged for rewriting.</p>;
  }
  return (
    <div className="space-y-6">
      {rewrites.map((r, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-muted">
            <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">You said</p>
            <p className="text-sm italic">&ldquo;{r.originalQuote}&rdquo;</p>
          </div>
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-wide text-info font-semibold mb-1.5">
                Your viewpoint — improved
              </p>
              <p className="text-sm leading-relaxed">{r.improvedVersion}</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-1.5">
                Best possible answer
              </p>
              <p className="text-sm leading-relaxed">{r.bestPossibleVersion}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
