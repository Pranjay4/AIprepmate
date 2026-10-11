"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Info, MessagesSquare, Sparkles, TrendingUp } from "lucide-react";
import { attachAiFeedback, track, useData } from "@/lib/cp/store";
import { INTERVIEW_TYPES, ROLE_MAP } from "@/lib/cp/content/roles";
import { RUBRIC, weakestDimension } from "@/lib/cp/rubric";
import { recommendations } from "@/lib/cp/insights";
import { fmtDate, fmtDuration } from "@/lib/cp/util";
import { Badge, Button, Card, CardHeader, Empty, LinkButton, Notice, Page, SampleBadge, cn, scoreTone } from "@/components/cp/ui";
import { RecCta } from "@/components/cp/RecCard";

function Dots({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={cn("h-2 w-5 rounded-full", n <= Math.round(score) ? "bg-accent" : "bg-surface-muted")} />)}
    </span>
  );
}

export default function ScorecardPage() {
  const { id } = useParams<{ id: string }>();
  const d = useData();
  const iv = d.interviews.find((x) => x.id === id);
  const [open, setOpen] = useState<number | null>(0);
  const [ai, setAi] = useState<{ status: "unknown" | "unavailable" | "ready" | "loading" | "error"; message?: string }>({ status: "unknown" });
  const recs = useMemo(() => recommendations(d), [d]);

  useEffect(() => {
    if (iv) track("feedback_viewed", { kind: "interview" });
    let alive = true;
    fetch("/api/interview/feedback")
      .then((r) => r.json())
      .then((j) => alive && setAi({ status: j.available ? "ready" : "unavailable" }))
      .catch(() => alive && setAi({ status: "unavailable" }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!iv) {
    return <Page narrow><Card><Empty icon={MessagesSquare} title="Scorecard not found" desc="This mock interview does not exist on this device." action={<LinkButton href="/interview" size="sm">Back to mock interviews</LinkButton>} /></Card></Page>;
  }

  const previous = d.interviews.filter((x) => x.type === iv.type && x.at < iv.at).pop();
  const delta = previous ? iv.overall - previous.overall : null;
  const typeLabel = INTERVIEW_TYPES.find((t) => t.id === iv.type)?.label;
  const weakKey = weakestDimension(iv);
  // Next practice step: the STAR lesson after a weak behavioural or HR round, otherwise the engine's top pick.
  const softWeak = (iv.type === "behavioural" || iv.type === "hr") && iv.overall < 70 && d.modules["common-star"]?.status !== "completed";
  const nextRec = recs.find((r) => !r.ruleId.startsWith("resume")) ?? recs[0];

  async function requestAi() {
    setAi({ status: "loading" });
    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: ROLE_MAP[iv!.roleId].name, type: typeLabel, answers: iv!.answers.map((a) => ({ prompt: a.prompt, answer: a.answer.slice(0, 6000) })) }),
      });
      const j = await res.json();
      if (!res.ok || !j.feedback) return setAi({ status: "error", message: j.error ?? "AI feedback is unavailable right now." });
      attachAiFeedback(iv!.id, j.feedback);
      setAi({ status: "ready" });
    } catch {
      setAi({ status: "error", message: "Could not reach the AI feedback service. Your rubric scorecard is unaffected." });
    }
  }

  return (
    <Page narrow>
      <Link href="/interview" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"><ArrowLeft size={13} /> Mock interviews</Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2">Scorecard {iv.seeded && <SampleBadge />}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{typeLabel} round · {ROLE_MAP[iv.roleId].name}</h1>
            <p className="text-xs text-muted mt-1">{fmtDate(iv.at, { day: "numeric", month: "long", year: "numeric" })} · {iv.answers.length} questions · {fmtDuration(Math.max(1, iv.durationSec / 60))}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold tracking-tight">{iv.overall}<span className="text-xl text-muted">/100</span></p>
            {delta !== null && <Badge tone={delta >= 0 ? "success" : "warning"}><TrendingUp size={11} aria-hidden />{delta >= 0 ? "+" : ""}{delta} vs previous {typeLabel} round</Badge>}
          </div>
        </div>
        <div className="mt-4">
          <Notice tone="neutral" icon={Info}>Rubric-based practice feedback. Scores come from countable signals in your writing (listed under each answer). They are not an AI judgement, cannot verify facts, and are not a definitive measure of hiring readiness.</Notice>
        </div>
      </Card>

      <Card>
        <CardHeader title="Rubric scores" desc="Average across your answers, each on a 1–5 scale." />
        <ul className="p-5 pt-4 space-y-3.5">
          {iv.rubric.map((r) => {
            const def = RUBRIC.find((x) => x.key === r.key)!;
            return (
              <li key={r.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="min-w-0 basis-56 flex-1">
                  <p className="text-sm font-medium">{r.label} <span className="text-xs font-normal text-muted">· weight {Math.round(def.weight * 100)}%</span></p>
                  <p className="text-[11px] text-muted leading-relaxed">{def.desc}</p>
                </div>
                <div className="flex items-center gap-3"><Dots score={r.score} /><span className="text-sm font-semibold tabular-nums w-8 text-right">{r.score.toFixed(1)}</span></div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Strengths</h2>
          {iv.strengths.length ? <ul className="mt-3 space-y-2 text-sm">{iv.strengths.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />{s}</li>)}</ul> : <p className="mt-3 text-sm text-muted">No dimension averaged 3.5 or higher yet. Apply the recommendations below and retry.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Areas for improvement</h2>
          {iv.improvements.length ? <ul className="mt-3 space-y-2 text-sm">{iv.improvements.map((s) => <li key={s} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />{s}</li>)}</ul> : <p className="mt-3 text-sm text-muted">Every dimension averaged 4 or higher.</p>}
        </Card>
      </div>

      {iv.recommendations.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Specific recommendations</h2>
          <ol className="mt-3 space-y-2 text-sm list-decimal pl-5">{iv.recommendations.map((s) => <li key={s} className="leading-relaxed">{s}</li>)}</ol>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Suggested follow-up questions</h2>
        <p className="text-xs text-muted mt-1">An interviewer would likely probe further with these. Prepare an answer for each.</p>
        <ul className="mt-3 space-y-2 text-sm">{iv.followUps.map((s) => <li key={s} className="flex gap-2"><MessagesSquare size={14} className="text-accent mt-0.5 shrink-0" />{s}</li>)}</ul>
      </Card>

      <section className="rounded-xl border border-accent/30 bg-accent-soft/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Recommended next practice task</p>
        {softWeak ? (
          <>
            <h2 className="mt-2 text-base font-semibold">Structured Answers with STAR</h2>
            <p className="mt-1 text-sm text-muted leading-relaxed"><span className="font-medium text-foreground/80">Why:</span> this {typeLabel} round scored {iv.overall}/100 and your lowest rubric dimension was {RUBRIC.find((x) => x.key === weakKey)!.label.toLowerCase()}. The STAR lesson and its outline exercise build exactly this kind of answer.</p>
            <div className="mt-3"><LinkButton href="/learn/common-star">Open lesson</LinkButton></div>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-base font-semibold">{nextRec.title}</h2>
            <p className="mt-1 text-sm text-muted leading-relaxed"><span className="font-medium text-foreground/80">Why:</span> {nextRec.reason}</p>
            <div className="mt-3"><RecCta rec={nextRec} /></div>
          </>
        )}
      </section>

      <Card>
        <CardHeader title="Answer-by-answer breakdown" desc="Open an answer to see the signals behind each score." />
        <ul className="mt-3 divide-y divide-border">
          {iv.answers.map((a, i) => (
            <li key={a.questionId}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-surface-muted">
                <span className="text-sm font-medium min-w-0">{i + 1}. {a.prompt}</span>
                <span className="flex items-center gap-2 shrink-0"><Badge tone={scoreTone(a.score)}>{a.score}/100</Badge><ChevronDown size={15} className={cn("text-muted transition-transform", open === i && "rotate-180")} /></span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 space-y-4">
                  <p className="rounded-lg border border-border p-3 text-sm leading-relaxed whitespace-pre-wrap">{a.answer || "— no answer given —"}</p>
                  <ul className="space-y-3">
                    {a.rubric.map((r) => (
                      <li key={r.key}>
                        <p className="flex items-center justify-between gap-3 text-xs font-medium">{r.label}<span className="flex items-center gap-2"><Dots score={r.score} />{r.score}/5</span></p>
                        <ul className="mt-1 text-xs text-muted space-y-0.5">{r.signals.map((s) => <li key={s}>· {s}</li>)}</ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={15} className="text-accent" /> Additional AI feedback <Badge>Optional</Badge></h2>
        {iv.ai ? (
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-[11px] text-muted">Generated by an AI model ({iv.ai.provider}) from your answers. It may contain mistakes; your rubric scores above are unchanged.</p>
            <p className="leading-relaxed">{iv.ai.summary}</p>
            <div><p className="text-xs font-semibold mb-1">Strengths</p><ul className="list-disc pl-5 space-y-1">{iv.ai.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div><p className="text-xs font-semibold mb-1">Improvements</p><ul className="list-disc pl-5 space-y-1">{iv.ai.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div><p className="text-xs font-semibold mb-1">Further follow-up questions</p><ul className="list-disc pl-5 space-y-1">{iv.ai.followUps.map((s) => <li key={s}>{s}</li>)}</ul></div>
          </div>
        ) : ai.status === "unavailable" ? (
          <p className="mt-2 text-sm text-muted leading-relaxed">No AI provider key is configured on this server, so this scorecard uses the rule-based rubric only. To enable AI-written feedback, add a provider key to <code className="text-xs">.env.local</code> (see the README).</p>
        ) : ai.status === "unknown" ? (
          <p className="mt-2 text-sm text-muted">Checking whether AI feedback is available…</p>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-muted leading-relaxed">An AI provider is configured. You can send your answers to it for additional written feedback. Your answers leave this browser only when you click the button.</p>
            {ai.status === "error" && <p role="alert" className="mt-2 text-sm text-danger">{ai.message}</p>}
            <div className="mt-3"><Button variant="secondary" size="sm" onClick={requestAi} disabled={ai.status === "loading" || iv.seeded}>{ai.status === "loading" ? "Generating…" : ai.status === "error" ? "Try again" : "Generate AI feedback"}</Button></div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <LinkButton href={`/interview?type=${iv.type}`}>Retake this round</LinkButton>
        <LinkButton href="/progress" variant="secondary">View progress</LinkButton>
      </div>
    </Page>
  );
}
