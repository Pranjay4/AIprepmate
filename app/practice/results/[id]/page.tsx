"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, CheckCircle2, Circle, ListChecks, MinusCircle, RotateCcw, XCircle } from "lucide-react";
import { startPractice, toggleSaved, track, useData } from "@/lib/cp/store";
import { QUESTION_MAP, TYPE_LABEL } from "@/lib/cp/content/questions";
import { moduleForTopic } from "@/lib/cp/content/modules";
import { fmtDate, fmtDuration } from "@/lib/cp/util";
import { Badge, Button, Card, CardHeader, Empty, LinkButton, Notice, Page, SampleBadge, cn, scoreTone } from "@/components/cp/ui";
import { AccuracyBars } from "@/components/cp/charts";
import { ReportIssue } from "@/components/cp/ReportIssue";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const d = useData();
  const router = useRouter();
  const a = d.attempts.find((x) => x.id === id);
  const [filter, setFilter] = useState<"all" | "incorrect">("all");

  useEffect(() => {
    if (a) track("feedback_viewed", { kind: "practice" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!a) {
    return <Page narrow><Card><Empty icon={ListChecks} title="Result not found" desc="This attempt does not exist on this device." action={<LinkButton href="/practice" size="sm">Back to practice</LinkButton>} /></Card></Page>;
  }

  const correct = a.responses.filter((r) => r.correct).length;
  const skipped = a.responses.filter((r) => r.answer === null).length;
  const byTopic = [...new Set(a.responses.map((r) => r.topic))].map((topic) => {
    const rs = a.responses.filter((r) => r.topic === topic);
    return { topic, n: rs.length, pct: Math.round((rs.reduce((s, r) => s + r.score, 0) / rs.length) * 100) };
  }).sort((x, y) => x.pct - y.pct);
  const weakest = byTopic[0];
  const weakModule = weakest && weakest.pct < 60 ? moduleForTopic(weakest.topic, d.profile.primaryRole) : undefined;
  const shown = a.responses.filter((r) => filter === "all" || !r.correct);
  const topics = [...new Set(a.responses.map((r) => r.topic))];

  function again() {
    if (startPractice({ title: a!.title.replace(/^Lesson quiz: /, ""), role: null, topics, count: a!.responses.length, source: { type: "bank" } })) router.push("/practice/session");
  }

  return (
    <Page narrow>
      <Link href="/practice" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"><ArrowLeft size={13} /> Practice</Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2">Results {a.seeded && <SampleBadge />}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{a.title}</h1>
            <p className="text-xs text-muted mt-1">{fmtDate(a.at, { day: "numeric", month: "long", year: "numeric" })} · {fmtDuration(Math.max(1, a.durationSec / 60))}{a.timeLimitSec ? ` of ${fmtDuration(a.timeLimitSec / 60)} allowed` : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold tracking-tight">{a.scorePct}<span className="text-xl text-muted">%</span></p>
            <Badge tone={scoreTone(a.scorePct)}>{correct} of {a.responses.length} correct{skipped ? ` · ${skipped} skipped` : ""}</Badge>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={again}><RotateCcw size={13} /> Practise these topics again</Button>
          {a.source.type === "task" && <LinkButton href="/roadmap" variant="secondary" size="sm">Back to roadmap</LinkButton>}
          {a.source.type === "module" && a.source.id && <LinkButton href={`/learn/${a.source.id}`} variant="secondary" size="sm">Review the lesson</LinkButton>}
          <LinkButton href="/progress" variant="ghost" size="sm">View progress</LinkButton>
        </div>
      </Card>

      {weakest && weakest.pct < 60 && (
        <Notice tone="warning">
          <strong className="font-semibold">Focus next on {weakest.topic}</strong> — you scored {weakest.pct}% on its {weakest.n} question{weakest.n === 1 ? "" : "s"} here.{" "}
          {weakModule ? <Link href={`/learn/${weakModule.id}`} className="font-medium text-accent hover:underline">Open “{weakModule.title}”</Link> : <Link href={`/practice?topic=${encodeURIComponent(weakest.topic)}`} className="font-medium text-accent hover:underline">Start a targeted set</Link>}
        </Notice>
      )}

      {byTopic.length > 1 && (
        <Card>
          <CardHeader title="Score by topic" />
          <div className="p-5 pt-4"><AccuracyBars rows={byTopic.map((t) => ({ label: t.topic, value: t.pct, note: `${t.n} question${t.n === 1 ? "" : "s"}` }))} /></div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Answer review</h2>
        <div className="flex gap-1.5">
          {(["all", "incorrect"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", filter === f ? "border-accent bg-accent-soft text-accent" : "border-border text-muted")}>
              {f === "all" ? `All (${a.responses.length})` : `To review (${a.responses.length - correct})`}
            </button>
          ))}
        </div>
      </div>

      {!shown.length && <Card><Empty icon={CheckCircle2} title="Nothing to review" desc="Every answer in this session was correct." /></Card>}

      {shown.map((r) => {
        const q = QUESTION_MAP[r.questionId];
        if (!q) return null;
        const n = a.responses.indexOf(r) + 1;
        const saved = d.saved.includes(q.id);
        return (
          <Card key={q.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {r.answer === null ? <Badge><MinusCircle size={11} aria-hidden />Skipped</Badge> : r.correct ? <Badge tone="success"><CheckCircle2 size={11} aria-hidden />Correct</Badge> : <Badge tone="danger"><XCircle size={11} aria-hidden />{r.score > 0 ? "Partly covered" : "Incorrect"}</Badge>}
                <Badge>{q.topic}</Badge>
                <Badge>{TYPE_LABEL[q.type]}</Badge>
              </div>
              <button type="button" onClick={() => toggleSaved(q.id)} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save for later"} className={cn("p-1.5 -m-1.5 rounded-md hover:bg-surface-muted", saved ? "text-accent" : "text-muted")}>
                {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              </button>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed whitespace-pre-line">{n}. {q.prompt}</p>

            {q.type === "mcq" && (
              <ul className="mt-3 space-y-1.5">
                {q.options!.map((o, j) => {
                  const right = j === q.answer;
                  const picked = r.answer === j;
                  return (
                    <li key={j} className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm", right ? "border-success bg-success-soft" : picked ? "border-danger bg-danger-soft" : "border-border")}>
                      {right ? <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" /> : picked ? <XCircle size={15} className="text-danger mt-0.5 shrink-0" /> : <Circle size={15} className="text-muted/50 mt-0.5 shrink-0" />}
                      <span className="flex-1">{o}</span>
                      <span className="text-[11px] text-muted shrink-0">{right && "Correct answer"}{picked && !right && "Your answer"}{picked && right && " · your answer"}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {q.type === "sql" && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Your query</p>
                  <pre className="rounded-lg bg-navy text-[#e6ebff] p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{r.answer === null ? "— not answered —" : String(r.answer)}</pre>
                  {r.detail && <p className={cn("mt-1.5 text-xs", r.correct ? "text-success" : "text-danger")}>{r.detail}</p>}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Reference solution</p>
                  <pre className="rounded-lg border border-border bg-surface-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{q.solution}</pre>
                  <p className="mt-1.5 text-[11px] text-muted">Any query that returns the same result is accepted. {a.seeded ? "This sample answer was seeded, not executed." : "Marked by executing both queries on the practice dataset."}</p>
                </div>
              </div>
            )}

            {(q.type === "short" || q.type === "case" || q.type === "interview") && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Your answer</p>
                  <p className="rounded-lg border border-border p-3 text-sm leading-relaxed whitespace-pre-wrap">{r.answer === null ? "— not answered —" : String(r.answer)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">Key-point check <span className="normal-case font-normal tracking-normal">— keyword-based, not AI. {r.detail}</span></p>
                  <ul className="space-y-1">
                    {q.keyPoints!.map((k) => {
                      const hit = r.matched?.includes(k.label);
                      return <li key={k.label} className="flex items-start gap-2 text-sm">{hit ? <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" aria-label="Detected" /> : <Circle size={15} className="text-muted/60 mt-0.5 shrink-0" aria-label="Not detected" />}<span className={hit ? "" : "text-muted"}>{k.label}</span></li>;
                    })}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Model answer</p>
                  <p className="rounded-lg bg-surface-muted p-3 text-sm leading-relaxed">{q.modelAnswer}</p>
                </div>
              </div>
            )}

            <p className="mt-3 rounded-lg bg-accent-soft/60 px-3 py-2.5 text-xs leading-relaxed"><span className="font-semibold">Explanation.</span> {q.explanation}</p>
            <div className="mt-3"><ReportIssue refId={`question:${q.id}`} label={`Question ${q.id}`} /></div>
          </Card>
        );
      })}
    </Page>
  );
}
