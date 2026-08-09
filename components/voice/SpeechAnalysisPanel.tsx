import type { SpeechMetrics } from "@/lib/fillerWordAnalysis";

export function SpeechAnalysisPanel({ metrics, onDismiss }: { metrics: SpeechMetrics; onDismiss: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-2.5 mb-2 text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-semibold text-muted">Speaking estimate (last turn) — heuristic, not a measured score</p>
        <button onClick={onDismiss} className="text-muted hover:text-foreground">
          &times;
        </button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
        <span>
          Pace: <b className="text-foreground">{metrics.paceLabel}</b> (~{metrics.wordsPerMinute} wpm)
        </span>
        <span>
          Filler words: <b className="text-foreground">{metrics.fillerWordCount}</b>
        </span>
        <span>
          Pauses &gt;1.2s: <b className="text-foreground">{metrics.pauseCount}</b>
        </span>
        {metrics.endsAbruptly && <span className="text-accent">Sentence may have trailed off</span>}
      </div>
    </div>
  );
}
