"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, ListChecks, RotateCcw, XCircle } from "lucide-react";
import type { QuestionResponse } from "@/lib/cp/types";
import { startModule, startPractice, submitModuleQuiz, track, useData } from "@/lib/cp/store";
import { MODULE_MAP } from "@/lib/cp/content/modules";
import { QUESTIONS, questionsForModule } from "@/lib/cp/content/questions";
import { gradeMcq, scorePct } from "@/lib/cp/grading";
import { fmtDate, fmtDuration } from "@/lib/cp/util";
import { Badge, Button, Card, DifficultyBadge, Empty, LinkButton, Notice, Page, Prose, SampleBadge, cn, scoreTone } from "@/components/cp/ui";
import { ReportIssue } from "@/components/cp/ReportIssue";

const nowMs = () => Date.now();
const secondsSince = (startMs: number) => Math.round((nowMs() - startMs) / 1000);

export default function ModulePage() {
  const { id } = useParams<{ id: string }>();
  const d = useData();
  const router = useRouter();
  const m = MODULE_MAP[id];
  const quiz = m ? questionsForModule(m.id) : [];
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuestionResponse[] | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const opened = useRef(0);

  useEffect(() => {
    opened.current = Date.now();
    if (m) startModule(m.id);
  }, [m]);

  if (!m) {
    return (
      <Page narrow>
        <Card><Empty icon={ListChecks} title="Lesson not found" desc="This lesson does not exist or has been moved." action={<LinkButton href="/learn" size="sm">Back to the library</LinkButton>} /></Card>
      </Page>
    );
  }

  const prog = d.modules[m.id];
  const linkedTask = d.roadmap?.tasks.find((t) => t.moduleId === m.id);
  const relatedCount = QUESTIONS.filter((q) => q.topic === m.topic && q.moduleId !== m.id).length;
  const allAnswered = quiz.every((q) => answers[q.id] !== undefined);

  function submit() {
    const responses = quiz.map((q) => gradeMcq(q, answers[q.id] ?? null));
    submitModuleQuiz(m.id, responses, Math.min(secondsSince(opened.current), quiz.length * 180));
    track("feedback_viewed", { kind: "module-quiz" });
    setResult(responses);
  }

  function practise() {
    const ok = startPractice({ title: `${m.topic} practice`, role: null, topics: [m.topic], count: 6, source: { type: "bank" } });
    if (ok) router.push("/practice/session");
    else setPracticeError("No further practice questions are available for this topic yet.");
  }

  return (
    <Page narrow>
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"><ArrowLeft size={13} /> Learning library</Link>

      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{m.topic}</Badge>
          <DifficultyBadge value={m.difficulty} />
          <Badge><Clock size={11} aria-hidden />{fmtDuration(m.durationMin)}</Badge>
          {prog?.status === "completed" && <Badge tone="success"><CheckCircle2 size={11} aria-hidden />Completed{prog.completedAt && ` ${fmtDate(prog.completedAt)}`}</Badge>}
          {prog?.seeded && <SampleBadge />}
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{m.title}</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">{m.description}</p>
        {linkedTask && <p className="mt-2 text-xs text-muted">Part of your roadmap: <Link href={`/roadmap?task=${linkedTask.id}`} className="text-accent hover:underline">week {linkedTask.week} · {linkedTask.title}</Link></p>}
      </header>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Learning objectives</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {m.objectives.map((o) => <li key={o} className="flex gap-2.5"><CheckCircle2 size={15} className="text-accent mt-0.5 shrink-0" aria-hidden />{o}</li>)}
        </ul>
      </Card>

      {m.sections.map((s, i) => (
        <Card key={s.heading} className="p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Section {i + 1} of {m.sections.length}</p>
          <h2 className="mt-1 mb-3 text-base font-semibold">{s.heading}</h2>
          <Prose text={s.body} />
        </Card>
      ))}

      <Card className="p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Practical exercise</p>
        <p className="mt-2 text-sm leading-relaxed">{m.exercise.prompt}</p>
        <p className="mt-2 text-xs text-muted">Try it on paper or in a notes app first, then compare with the worked solution.</p>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => setShowSolution((v) => !v)} aria-expanded={showSolution}>{showSolution ? "Hide" : "Show"} worked solution</Button>
        </div>
        {showSolution && <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-surface-muted p-4 text-[13px] leading-relaxed font-sans">{m.exercise.solution}</pre>}
      </Card>

      {m.external && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Further reading</h2>
          <p className="text-xs text-muted mt-1">External resources — not written or maintained by CampusPrep.</p>
          <ul className="mt-3 space-y-2">
            {m.external.map((e) => (
              <li key={e.url}><a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">{e.label} <ExternalLink size={12} aria-hidden /></a></li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5 sm:p-6" id="quiz">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Knowledge check</h2>
          {prog?.quizScore !== undefined && !result && <Badge tone={scoreTone(prog.quizScore)}>Previous score {prog.quizScore}%</Badge>}
        </div>
        <p className="text-xs text-muted mt-1">{quiz.length} questions. Submitting marks the lesson complete and records your score.</p>

        {result && (
          <div className="mt-4">
            <Notice tone={scoreTone(scorePct(result))}>
              <strong className="font-semibold">You scored {scorePct(result)}%</strong> ({result.filter((r) => r.correct).length} of {result.length} correct). {scorePct(result) >= 60 ? "Lesson complete — the linked roadmap task has been updated." : "Lesson marked complete, but review the explanations below and retake the quiz to strengthen this topic."}
            </Notice>
          </div>
        )}

        <ol className="mt-5 space-y-6">
          {quiz.map((q, i) => {
            const res = result?.find((r) => r.questionId === q.id);
            return (
              <li key={q.id}>
                <fieldset disabled={!!result}>
                  <legend className="text-sm font-medium whitespace-pre-line leading-relaxed">{i + 1}. {q.prompt}</legend>
                  <div className="mt-2.5 space-y-2">
                    {q.options!.map((o, j) => {
                      const picked = answers[q.id] === j;
                      const isRight = result && j === q.answer;
                      const isWrongPick = result && picked && j !== q.answer;
                      return (
                        <label key={j} className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm", !result && "cursor-pointer hover:bg-surface-muted",
                          isRight ? "border-success bg-success-soft" : isWrongPick ? "border-danger bg-danger-soft" : picked ? "border-accent bg-accent-soft/50" : "border-border")}>
                          <input type="radio" name={q.id} className="mt-1 accent-[var(--accent)]" checked={picked} onChange={() => setAnswers((a) => ({ ...a, [q.id]: j }))} />
                          <span className="flex-1">{o}</span>
                          {isRight && <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" aria-label="Correct answer" />}
                          {isWrongPick && <XCircle size={16} className="text-danger shrink-0 mt-0.5" aria-label="Your answer — incorrect" />}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {res && <p className="mt-2.5 rounded-lg bg-surface-muted px-3 py-2.5 text-xs leading-relaxed"><span className="font-semibold">{res.correct ? "Correct." : "Not quite."}</span> {q.explanation}</p>}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!result ? (
            <>
              <Button onClick={submit} disabled={!allAnswered}>Submit answers</Button>
              {!allAnswered && <span className="text-xs text-muted">Answer all {quiz.length} questions to submit ({Object.keys(answers).length} answered).</span>}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => { setResult(null); setAnswers({}); opened.current = nowMs(); }}><RotateCcw size={14} /> Retake quiz</Button>
              {relatedCount > 0 && <Button onClick={practise}><ListChecks size={14} /> Practise {m.topic}</Button>}
              {linkedTask && <LinkButton href="/roadmap" variant="ghost">Back to roadmap</LinkButton>}
            </>
          )}
        </div>
      </Card>

      {!result && relatedCount > 0 && (
        <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Related practice</h2>
            <p className="text-xs text-muted mt-1">{relatedCount} more {m.topic} question{relatedCount === 1 ? "" : "s"} in the practice bank.</p>
            {practiceError && <p role="alert" className="text-xs text-danger mt-1">{practiceError}</p>}
          </div>
          <Button variant="secondary" size="sm" onClick={practise}>Start a {m.topic} set</Button>
        </Card>
      )}

      <ReportIssue refId={`module:${m.id}`} label={m.title} />
    </Page>
  );
}
