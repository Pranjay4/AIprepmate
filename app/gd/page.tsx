"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mic, Zap, BookOpen, LineChart, History } from "lucide-react";
import { getSessions } from "@/lib/storage/sessionHistory";
import type { CompletedSession } from "@/lib/schema";

export default function Home() {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);

  useEffect(() => {
    // localStorage is only available client-side; load after mount to avoid hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(getSessions());
  }, []);

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + x.report.overallScore, 0) / sessions.length)
    : null;
  const latest = sessions[sessions.length - 1];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <div>
        <p className="text-sm text-muted font-medium">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Ready for today&apos;s discussion?</h1>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/gd/setup"
          className="group rounded-xl bg-navy text-white p-6 flex flex-col justify-between overflow-hidden relative"
        >
          <div>
            <div className="h-9 w-9 rounded-lg bg-accent/20 text-accent flex items-center justify-center mb-4">
              <Mic size={18} />
            </div>
            <h2 className="text-lg font-semibold">Start a Group Discussion</h2>
            <p className="text-sm text-white/60 mt-1.5 leading-relaxed">
              Choose a topic, difficulty, and panel size — sit in on a full realistic GD with 5&ndash;9 AI candidates.
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            Start GD <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        <Link
          href="/gd/setup?quick=1"
          className="group rounded-xl bg-surface border border-border p-6 flex flex-col justify-between"
        >
          <div>
            <div className="h-9 w-9 rounded-lg bg-info/10 text-info flex items-center justify-center mb-4">
              <Zap size={18} />
            </div>
            <h2 className="text-lg font-semibold">Quick Practice</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">
              A fast 5-minute GD — good for a warm-up between real prep sessions.
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            Quick practice <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Sessions completed" value={sessions.length.toString()} />
        <StatCard label="Average score" value={avgScore !== null ? `${avgScore}/100` : "—"} />
        <StatCard label="Latest score" value={latest ? `${latest.report.overallScore}/100` : "—"} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <NavCard href="/gd/sessions" icon={History} label="Previous Sessions" desc="Review past transcripts & reports" />
        <NavCard href="/gd/performance" icon={LineChart} label="Performance" desc="Score trends & recurring weaknesses" />
        <NavCard href="/gd/topics" icon={BookOpen} label="Topics" desc="Browse the GD topic bank" />
      </div>

      {sessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3">Recent sessions</h3>
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {[...sessions].reverse().slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/gd/sessions/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.topic}</p>
                  <p className="text-xs text-muted mt-0.5">{new Date(s.dateIso).toLocaleDateString()} &middot; {s.difficulty}</p>
                </div>
                <div className="text-sm font-semibold shrink-0 ml-4">{s.report.overallScore}/100</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="text-2xl font-semibold mt-1 tracking-tight">{value}</p>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: typeof History;
  label: string;
  desc: string;
}) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
      <Icon size={17} className="text-muted mb-2" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted mt-0.5">{desc}</p>
    </Link>
  );
}
