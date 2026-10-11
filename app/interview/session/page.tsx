"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Lightbulb, MessagesSquare } from "lucide-react";
import { discardInterview, saveInterviewAnswer, submitInterview, useData } from "@/lib/cp/store";
import { INTERVIEW_MAP } from "@/lib/cp/content/interviews";
import { INTERVIEW_TYPES, ROLE_MAP } from "@/lib/cp/content/roles";
import { Badge, Button, Card, Empty, LinkButton, Modal, Page, Progress, Textarea, cn } from "@/components/cp/ui";

export default function InterviewSessionPage() {
  const d = useData();
  const router = useRouter();
  const a = d.activeInterview;
  const [answers, setAnswers] = useState<Record<string, string>>(a?.answers ?? {});
  const [index, setIndex] = useState(a?.index ?? 0);
  const [showTip, setShowTip] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  if (!a) {
    return (
      <Page narrow>
        <Card><Empty icon={MessagesSquare} title={done ? "Building your scorecard…" : "No interview in progress"} desc={done ? "One moment." : "Set up a mock interview to begin."} action={!done && <LinkButton href="/interview" size="sm">Set up an interview</LinkButton>} /></Card>
      </Page>
    );
  }

  const q = INTERVIEW_MAP[a.questionIds[index]];
  const total = a.questionIds.length;
  const text = answers[q.id] ?? "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const answered = a.questionIds.filter((id) => (answers[id] ?? "").trim()).length;

  function go(i: number) {
    saveInterviewAnswer(q.id, text, i);
    setIndex(i);
    setShowTip(false);
  }

  function submit() {
    saveInterviewAnswer(q.id, text);
    setDone(true);
    const id = submitInterview();
    if (id) router.replace(`/interview/${id}`);
  }

  return (
    <Page narrow>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Mock interview</p>
          <h1 className="text-lg font-semibold tracking-tight">{INTERVIEW_TYPES.find((t) => t.id === a.type)?.label} round · {ROLE_MAP[a.roleId].short}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { discardInterview(); router.push("/interview"); }}>Discard</Button>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1.5"><span>Question {index + 1} of {total}</span><span>{answered} answered</span></div>
        <Progress value={(answered / total) * 100} label="Questions answered" />
        <div className="mt-3 flex gap-1.5">
          {a.questionIds.map((id, i) => (
            <button key={id} type="button" onClick={() => go(i)} aria-label={`Question ${i + 1}`} aria-current={i === index ? "step" : undefined}
              className={cn("h-8 w-8 rounded-md border text-xs font-medium", i === index ? "border-accent bg-accent text-white dark:text-navy" : (answers[id] ?? "").trim() ? "border-accent/40 bg-accent-soft text-accent" : "border-border text-muted")}>{i + 1}</button>
          ))}
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <Badge tone="accent">Interviewer</Badge>
        <p className="mt-3 text-base font-medium leading-relaxed">{q.prompt}</p>
        <div className="mt-3">
          <button type="button" onClick={() => setShowTip((v) => !v)} aria-expanded={showTip} className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"><Lightbulb size={12} /> {showTip ? "Hide hint" : "Need a hint on structure?"}</button>
          {showTip && <p className="mt-2 rounded-lg bg-accent-soft/60 px-3 py-2 text-xs leading-relaxed">{q.tip}</p>}
        </div>
        <label htmlFor="iv-answer" className="block text-xs font-medium mt-5 mb-1.5">Your answer</label>
        <Textarea id="iv-answer" rows={10} value={text} onChange={(e) => setAnswers((x) => ({ ...x, [q.id]: e.target.value }))} onBlur={() => saveInterviewAnswer(q.id, text)} placeholder="Write as you would speak — aim for 120–250 words." />
        <p className="mt-1.5 text-[11px] text-muted">{words} word{words === 1 ? "" : "s"} · your draft is saved automatically</p>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft size={15} /> Previous</Button>
        {index < total - 1 ? <Button onClick={() => go(index + 1)}>Next question <ArrowRight size={15} /></Button> : <Button onClick={() => { saveInterviewAnswer(q.id, text); setConfirm(true); }}>Submit for evaluation</Button>}
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit your interview?" footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Keep editing</Button><Button onClick={submit}>Submit and see scorecard</Button></>}>
        <p className="text-sm leading-relaxed">You have answered <strong>{answered} of {total}</strong> questions.{answered < total && " Unanswered questions score zero in this interview."}</p>
        <p className="text-sm text-muted mt-2">Answers are scored by a rule-based rubric. It is practice feedback, not a judgement of hiring readiness.</p>
      </Modal>
    </Page>
  );
}
