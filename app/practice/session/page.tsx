"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, ChevronDown, Database, Info, ListChecks, Play, Timer } from "lucide-react";
import type { Question, QuestionResponse } from "@/lib/cp/types";
import { answerQuestion, discardPractice, setSessionIndex, submitPractice, toggleSaved, useData } from "@/lib/cp/store";
import { QUESTION_MAP, TYPE_LABEL } from "@/lib/cp/content/questions";
import { SQL_TABLES } from "@/lib/cp/content/sqlData";
import { gradeMcq, gradeWritten, unanswered } from "@/lib/cp/grading";
import { checkSql, runSql, type SqlResult } from "@/lib/cp/sql";
import { Badge, Button, Card, DifficultyBadge, Empty, LinkButton, Modal, Notice, Page, Progress, Textarea, cn } from "@/components/cp/ui";

function clock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function SessionPage() {
  const d = useData();
  const router = useRouter();
  const session = d.activeSession;
  const [answers, setAnswers] = useState<Record<string, string | number>>(session?.answers ?? {});
  const [index, setIndex] = useState(session?.index ?? 0);
  const [now, setNow] = useState(() => Date.now());
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const submitted = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = useCallback(async () => {
    if (!session || submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    setError("");
    try {
      const responses: QuestionResponse[] = [];
      for (const qid of session.questionIds) {
        const q = QUESTION_MAP[qid];
        const a = answersRef.current[qid];
        if (a === undefined || (typeof a === "string" && !a.trim())) responses.push(unanswered(q));
        else if (q.type === "mcq") responses.push(gradeMcq(q, a as number));
        else if (q.type === "sql") {
          const res = await checkSql(String(a), q.solution!, q.orderMatters);
          responses.push({ questionId: q.id, topic: q.topic, type: q.type, answer: String(a), correct: res.correct, score: res.correct ? 1 : 0, detail: res.detail });
        } else responses.push(gradeWritten(q, String(a)));
      }
      const id = submitPractice(responses);
      router.replace(`/practice/results/${id}`);
    } catch (e) {
      submitted.current = false;
      setSubmitting(false);
      setConfirm(false);
      setError(e instanceof Error ? `Could not mark this session: ${e.message}` : "Could not mark this session. Please try again.");
    }
  }, [session, router]);

  const elapsed = session ? (now - new Date(session.startedAt).getTime()) / 1000 : 0;
  const remaining = session?.timeLimitSec ? session.timeLimitSec - elapsed : null;

  useEffect(() => {
    if (remaining === null || remaining > 0) return;
    // Time is up: submit on the next tick with whatever has been answered.
    const t = setTimeout(submit, 0);
    return () => clearTimeout(t);
  }, [remaining, submit]);

  if (!session) {
    return (
      <Page narrow>
        <Card><Empty icon={ListChecks} title={submitting ? "Marking your answers…" : "No practice session in progress"} desc={submitting ? "One moment." : "Start a new session from the practice bank or from a roadmap task."} action={!submitting && <LinkButton href="/practice" size="sm">Go to practice</LinkButton>} /></Card>
      </Page>
    );
  }

  const q = QUESTION_MAP[session.questionIds[index]];
  const total = session.questionIds.length;
  const isAnswered = (id: string) => answers[id] !== undefined && String(answers[id]).trim() !== "";
  const answeredCount = session.questionIds.filter(isAnswered).length;

  function setAnswer(value: string | number) {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    // Multiple-choice picks are saved immediately; text is saved on navigation and blur.
    if (typeof value === "number") answerQuestion(q.id, value);
  }
  function persistText() {
    const v = answersRef.current[q.id];
    if (typeof v === "string" && v !== session!.answers[q.id]) answerQuestion(q.id, v);
  }
  function go(i: number) {
    persistText();
    setIndex(i);
    setSessionIndex(i);
  }

  return (
    <Page narrow>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Practice session</p>
          <h1 className="text-lg font-semibold tracking-tight truncate">{session.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={remaining !== null && remaining < 60 ? "danger" : "neutral"} className="text-xs tabular-nums py-1">
            <Timer size={12} aria-hidden />{remaining !== null ? `${clock(remaining)} left` : clock(elapsed)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => { discardPractice(); router.push("/practice"); }}>Discard</Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1.5"><span>Question {index + 1} of {total}</span><span>{answeredCount} answered</span></div>
        <Progress value={(answeredCount / total) * 100} label="Questions answered" />
        <nav aria-label="Question navigation" className="mt-3 flex flex-wrap gap-1.5">
          {session.questionIds.map((id, i) => (
            <button key={id} type="button" onClick={() => go(i)} aria-current={i === index ? "step" : undefined} aria-label={`Question ${i + 1}${isAnswered(id) ? ", answered" : ", not answered"}`}
              className={cn("h-8 w-8 rounded-md border text-xs font-medium", i === index ? "border-accent bg-accent text-white dark:text-navy" : isAnswered(id) ? "border-accent/40 bg-accent-soft text-accent" : "border-border text-muted hover:bg-surface-muted")}>
              {i + 1}
            </button>
          ))}
        </nav>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{q.topic}</Badge>
            <Badge>{TYPE_LABEL[q.type]}</Badge>
            <DifficultyBadge value={q.difficulty} />
          </div>
          <button type="button" onClick={() => toggleSaved(q.id)} aria-pressed={d.saved.includes(q.id)} aria-label={d.saved.includes(q.id) ? "Remove from saved" : "Save for later"} title={d.saved.includes(q.id) ? "Saved — click to remove" : "Save for later"} className={cn("p-1.5 -m-1.5 rounded-md hover:bg-surface-muted", d.saved.includes(q.id) ? "text-accent" : "text-muted")}>
            {d.saved.includes(q.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
        <p className="mt-4 text-[15px] font-medium leading-relaxed whitespace-pre-line">{q.prompt}</p>

        <div className="mt-5">
          {q.type === "mcq" && (
            <div role="radiogroup" aria-label="Answer options" className="space-y-2">
              {q.options!.map((o, j) => (
                <label key={j} className={cn("flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm cursor-pointer", answers[q.id] === j ? "border-accent bg-accent-soft/50" : "border-border hover:bg-surface-muted")}>
                  <input type="radio" name={q.id} className="mt-1 accent-[var(--accent)]" checked={answers[q.id] === j} onChange={() => setAnswer(j)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === "sql" && <SqlEditor key={q.id} value={String(answers[q.id] ?? "")} onChange={setAnswer} onBlur={persistText} />}
          {(q.type === "short" || q.type === "case" || q.type === "interview") && (
            <WrittenEditor key={q.id} q={q} value={String(answers[q.id] ?? "")} onChange={setAnswer} onBlur={persistText} />
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft size={15} /> Previous</Button>
        {index < total - 1 ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { persistText(); setConfirm(true); }}>Finish</Button>
            <Button onClick={() => go(index + 1)}>Next <ArrowRight size={15} /></Button>
          </div>
        ) : (
          <Button onClick={() => { persistText(); setConfirm(true); }}>Review and submit</Button>
        )}
      </div>

      <Modal open={confirm} onClose={() => !submitting && setConfirm(false)} title="Submit this session?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(false)} disabled={submitting}>Keep working</Button><Button onClick={submit} disabled={submitting}>{submitting ? "Marking…" : "Submit answers"}</Button></>}
      >
        <p className="text-sm leading-relaxed">You have answered <strong>{answeredCount} of {total}</strong> questions.{answeredCount < total && " Unanswered questions are marked incorrect for this session's score, but are not counted in your topic accuracy."}</p>
        <p className="text-sm text-muted mt-2">After submitting you will see the correct answers and an explanation for every question.</p>
      </Modal>
    </Page>
  );
}

function SqlEditor({ value, onChange, onBlur }: { value: string; onChange: (v: string) => void; onBlur: () => void }) {
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [showData, setShowData] = useState(false);

  async function run() {
    setRunning(true);
    setError("");
    try {
      setResult(await runSql(value));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "The query could not be run.");
    }
    setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border">
        <button type="button" onClick={() => setShowData((v) => !v)} aria-expanded={showData} className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium">
          <span className="flex items-center gap-2"><Database size={13} className="text-accent" /> Practice dataset: {SQL_TABLES.map((t) => t.name).join(", ")}</span>
          <ChevronDown size={14} className={cn("transition-transform", showData && "rotate-180")} />
        </button>
        <div className="border-t border-border px-3.5 py-3 space-y-1 text-xs font-mono text-muted">
          {SQL_TABLES.map((t) => <p key={t.name}><span className="text-foreground font-semibold">{t.name}</span>({t.columns.join(", ")})</p>)}
        </div>
        {showData && (
          <div className="border-t border-border p-3.5 space-y-4">
            {SQL_TABLES.map((t) => <DataTable key={t.name} caption={`${t.name} — ${t.rows.length} rows`} columns={t.columns} rows={t.rows} />)}
          </div>
        )}
      </div>

      <label htmlFor="sql-editor" className="sr-only">SQL query</label>
      <textarea
        id="sql-editor" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} spellCheck={false} rows={7}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
        placeholder={"SELECT ...\nFROM ...\nWHERE ..."}
        className="w-full rounded-lg border border-border bg-navy text-[#e6ebff] placeholder:text-white/30 font-mono text-[13px] leading-relaxed p-3.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={run} disabled={running || !value.trim()}><Play size={13} /> {running ? "Running…" : "Run query"}</Button>
        <span className="text-[11px] text-muted">Ctrl/⌘ + Enter to run. Running a query does not submit your answer.</span>
      </div>
      {error && <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-xs font-mono text-danger">{error}</p>}
      {result && (result.rows.length ? <DataTable caption={`Result — ${result.rows.length} row${result.rows.length === 1 ? "" : "s"}`} columns={result.columns} rows={result.rows} /> : <p className="text-xs text-muted">The query ran and returned no rows.</p>)}
      <Notice tone="neutral" icon={Info}>
        Your query is executed for real in your browser (AlaSQL engine) against the dataset above, and marked by comparing your result with the reference result. Only single SELECT statements are supported, and some dialect-specific syntax may differ from MySQL or PostgreSQL. Give each output column a distinct name.
      </Notice>
    </div>
  );
}

function DataTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: unknown[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs font-mono w-full">
        <caption className="text-left text-[11px] font-sans font-medium text-muted pb-1.5">{caption}</caption>
        <thead><tr>{columns.map((c) => <th key={c} className="text-left font-semibold px-2.5 py-1.5 bg-surface-muted border border-border whitespace-nowrap">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-2.5 py-1.5 border border-border whitespace-nowrap">{c === null || c === undefined ? <span className="text-muted">NULL</span> : typeof c === "number" ? Math.round(c * 100) / 100 : String(c)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WrittenEditor({ q, value, onChange, onBlur }: { q: Question; value: string; onChange: (v: string) => void; onBlur: () => void }) {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  const target = q.type === "case" ? "150–300" : "60–150";
  return (
    <div className="space-y-3">
      <label htmlFor="written" className="sr-only">Your answer</label>
      <Textarea id="written" rows={q.type === "case" ? 12 : 8} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder="Write your answer here…" />
      <p className="text-[11px] text-muted">{words} word{words === 1 ? "" : "s"} · suggested length {target} words</p>
      <Notice tone="neutral" icon={Info}>
        Written answers are checked by simple keyword matching against a list of key points — it is not AI and cannot judge the quality of your reasoning. After submitting, compare your answer with the model answer.
      </Notice>
    </div>
  );
}
