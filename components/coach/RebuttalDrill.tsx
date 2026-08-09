"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading-argument" | "responding" | "loading-feedback" | "done";

export function RebuttalDrill({ topic }: { topic: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [argument, setArgument] = useState("");
  const [userRebuttal, setUserRebuttal] = useState("");
  const [feedback, setFeedback] = useState<{ feedback: string; strongerRebuttal?: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startDrill() {
    setPhase("loading-argument");
    setError(null);
    setFeedback(null);
    setUserRebuttal("");
    try {
      const res = await fetch("/api/coach/rebuttal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "challenge", topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate a challenge.");
      setArgument(data.argument);
      setPhase("responding");
      setSecondsLeft(30);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            submitRebuttal();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  async function submitRebuttal() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("loading-feedback");
    try {
      const res = await fetch("/api/coach/rebuttal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", argument, userRebuttal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to score your rebuttal.");
      setFeedback(data);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("done");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {phase === "idle" && (
        <div>
          <p className="text-sm text-muted mb-3">
            You&apos;ll get a confident AI argument and 30 seconds to rebut it — good practice for handling pushback live.
          </p>
          <button onClick={startDrill} className="rounded-lg bg-navy text-white text-sm font-medium px-4 py-2">
            Start rebuttal drill
          </button>
        </div>
      )}

      {phase === "loading-argument" && <p className="text-sm text-muted">Preparing an argument…</p>}

      {(phase === "responding" || phase === "loading-feedback") && (
        <div className="space-y-3">
          <div className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-danger font-semibold mb-1">Argument to rebut</p>
            <p className="text-sm leading-relaxed">{argument}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Your rebuttal</p>
            <p className={`text-xs font-semibold tabular-nums ${secondsLeft <= 10 ? "text-danger" : "text-muted"}`}>
              {secondsLeft}s
            </p>
          </div>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
            rows={3}
            value={userRebuttal}
            onChange={(e) => setUserRebuttal(e.target.value)}
            disabled={phase === "loading-feedback"}
            placeholder="Type your rebuttal…"
            autoFocus
          />
          <button
            onClick={submitRebuttal}
            disabled={phase === "loading-feedback" || !userRebuttal.trim()}
            className="rounded-lg bg-navy text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
          >
            {phase === "loading-feedback" ? "Scoring…" : "Submit rebuttal"}
          </button>
        </div>
      )}

      {phase === "done" && feedback && (
        <div className="space-y-3">
          <div className="rounded-lg bg-surface-muted px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Feedback</p>
            <p className="text-sm leading-relaxed">{feedback.feedback}</p>
          </div>
          {feedback.strongerRebuttal && (
            <div className="rounded-lg bg-success/5 border border-success/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-success font-semibold mb-1">A stronger rebuttal</p>
              <p className="text-sm leading-relaxed">{feedback.strongerRebuttal}</p>
            </div>
          )}
          <button onClick={startDrill} className="rounded-lg border border-border text-sm font-medium px-4 py-2">
            Try another
          </button>
        </div>
      )}

      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}
