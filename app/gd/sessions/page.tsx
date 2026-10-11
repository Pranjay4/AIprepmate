"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessions } from "@/lib/storage/sessionHistory";
import type { CompletedSession } from "@/lib/schema";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<CompletedSession[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(getSessions());
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-sm text-muted font-medium">History</p>
      <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-6">Previous Sessions</h1>

      {sessions && sessions.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted mb-4">You haven&apos;t completed a GD yet.</p>
          <Link href="/gd/setup" className="rounded-lg bg-navy text-white text-sm font-medium px-4 py-2">
            Start your first GD
          </Link>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {[...sessions].reverse().map((s) => (
            <Link key={s.id} href={`/gd/sessions/${s.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-surface-muted transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.topic}</p>
                <p className="text-xs text-muted mt-1">
                  {new Date(s.dateIso).toLocaleString()} &middot; {s.difficulty} &middot; {s.durationMinutes} min &middot;{" "}
                  {s.metrics.interventionCount} intervention{s.metrics.interventionCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="text-lg font-semibold shrink-0 ml-4">{s.report.overallScore}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
