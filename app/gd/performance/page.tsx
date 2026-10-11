"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getSessions, aggregateWeaknesses, computeTrend } from "@/lib/storage/sessionHistory";
import type { CompletedSession, CoachPlan } from "@/lib/schema";
import { RebuttalDrill } from "@/components/coach/RebuttalDrill";

export default function PerformancePage() {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(getSessions());
  }, []);

  const trend = useMemo(() => computeTrend(sessions), [sessions]);
  const weaknesses = useMemo(() => aggregateWeaknesses(sessions), [sessions]);

  const structureImprovement = useMemo(() => {
    if (trend.length < 2) return null;
    const recent = trend.slice(-5);
    const first = recent[0].structure;
    const last = recent[recent.length - 1].structure;
    if (first === 0) return null;
    const pct = Math.round(((last - first) / first) * 100);
    return { pct, count: recent.length };
  }, [trend]);

  async function generatePlan() {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/coach/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan.");
      setPlan(data);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPlanLoading(false);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-muted font-medium">Performance</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-6">Your GD Skill Trend</h1>
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-muted">
          Complete a GD to start tracking your performance over time.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 pb-16">
      <div>
        <p className="text-sm text-muted font-medium">Performance</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Your GD Skill Trend</h1>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-3">Overall score across sessions</h2>
        <div className="rounded-xl border border-border bg-surface p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="session" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="overall" name="Overall" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {structureImprovement && (
          <p className="text-xs text-muted mt-2">
            Your structure has {structureImprovement.pct >= 0 ? "improved" : "declined"} by{" "}
            <span className="font-semibold text-foreground">{Math.abs(structureImprovement.pct)}%</span> across your last{" "}
            {structureImprovement.count} sessions.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Recurring weaknesses</h2>
        {weaknesses.length === 0 ? (
          <p className="text-sm text-muted">No repeated weaknesses detected yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {weaknesses.slice(0, 8).map((w) => (
              <div key={w.weakness} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm">{w.weakness}</p>
                <span className="text-xs text-muted shrink-0 ml-3">
                  {w.count}&times;
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Personalized coaching</h2>
        {!plan && (
          <button
            onClick={generatePlan}
            disabled={planLoading || sessions.length < 2}
            className="rounded-lg bg-navy text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50"
          >
            {planLoading ? "Analyzing your sessions…" : "Generate my coaching plan"}
          </button>
        )}
        {sessions.length < 2 && !plan && (
          <p className="text-xs text-muted mt-2">Complete at least 2 sessions to unlock personalized coaching.</p>
        )}
        {planError && <p className="text-sm text-danger mt-2">{planError}</p>}
        {plan && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <p className="text-sm leading-relaxed">{plan.insight}</p>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Recurring pattern</p>
              <ul className="space-y-1">
                {plan.recurringWeaknesses.map((w, i) => (
                  <li key={i} className="text-sm">
                    &bull; {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Targeted exercises &middot; {plan.exerciseType.replace("-", " ")}
              </p>
              <ul className="space-y-1.5">
                {plan.exercises.map((ex, i) => (
                  <li key={i} className="text-sm rounded-lg bg-surface-muted px-3 py-2">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Rebuttal practice</h2>
        <RebuttalDrill topic={sessions[sessions.length - 1]?.topic || "AI regulation"} />
      </section>
    </div>
  );
}
