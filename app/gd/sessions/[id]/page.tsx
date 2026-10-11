"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSessions } from "@/lib/storage/sessionHistory";
import type { CompletedSession } from "@/lib/schema";
import { ReportView } from "@/components/report/ReportView";
import { PERSONAS } from "@/lib/personas";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<CompletedSession | null | undefined>(undefined);

  useEffect(() => {
    const sessions = getSessions();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(sessions.find((s) => s.id === params.id) || null);
  }, [params.id]);

  if (session === undefined) return null;

  if (session === null) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-muted mb-3">Session not found.</p>
        <Link href="/gd/sessions" className="text-sm underline">
          Back to previous sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10 pb-16">
      <ReportView topic={session.topic} report={session.report} />

      <section>
        <h2 className="text-base font-semibold mb-4">Full transcript</h2>
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {session.transcript.map((t) => (
            <div key={t.id} className="px-4 py-3">
              <p className="text-xs font-semibold mb-0.5">
                {t.speakerName}
                {t.speakerType === "ai" && t.personaId && (
                  <span className="text-muted font-normal"> &middot; {PERSONAS[t.personaId].archetype}</span>
                )}
              </p>
              <p className="text-sm leading-relaxed">{t.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
