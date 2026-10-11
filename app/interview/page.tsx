"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MessagesSquare, Play, ShieldCheck } from "lucide-react";
import type { InterviewType, RoleId } from "@/lib/cp/types";
import { discardInterview, startInterview, useData } from "@/lib/cp/store";
import { interviewPool } from "@/lib/cp/content/interviews";
import { INTERVIEW_TYPES, ROLES, ROLE_MAP } from "@/lib/cp/content/roles";
import { RUBRIC } from "@/lib/cp/rubric";
import { fmtDate } from "@/lib/cp/util";
import { Badge, Button, Card, CardHeader, Empty, Notice, Page, PageHeader, SampleBadge, Select, cn, scoreTone } from "@/components/cp/ui";

export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewHome />
    </Suspense>
  );
}

function InterviewHome() {
  const d = useData();
  const router = useRouter();
  const params = useSearchParams();
  const taskId = params.get("task") ?? undefined;
  const task = d.roadmap?.tasks.find((t) => t.id === taskId);
  const presetType = INTERVIEW_TYPES.find((t) => t.id === params.get("type"))?.id;
  const [role, setRole] = useState<RoleId>(d.profile.primaryRole ?? "ba");
  const [type, setType] = useState<InterviewType>(presetType ?? "behavioural");
  const [count, setCount] = useState(3);
  const [error, setError] = useState("");

  const pool = interviewPool(role, type);
  const n = Math.min(count, pool.length);
  const history = [...d.interviews].reverse();

  function begin() {
    if (startInterview(role, type, n, task?.id)) router.push("/interview/session");
    else setError("No questions are available for this combination yet.");
  }

  return (
    <Page>
      <PageHeader eyebrow="Mock interview" title="Practise interview answers" subtitle="Answer a short sequence of questions in writing, then get a scorecard built from a transparent five-part rubric, with strengths, improvements and follow-up questions." />

      {d.activeInterview && (
        <Notice tone="accent" icon={Play}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span><strong className="font-semibold">Interview in progress</strong> — {INTERVIEW_TYPES.find((t) => t.id === d.activeInterview!.type)?.label}, {Object.values(d.activeInterview.answers).filter((a) => a.trim()).length} of {d.activeInterview.questionIds.length} answered.</span>
            <Link href="/interview/session" className="font-medium text-accent hover:underline">Resume</Link>
            <button type="button" onClick={discardInterview} className="text-muted hover:text-foreground hover:underline">Discard</button>
          </div>
        </Notice>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Set up a mock interview</h2>
          {task && <p className="text-xs text-muted mt-1">For roadmap task: <span className="text-foreground font-medium">{task.title}</span> — submitting completes it.</p>}

          <div className="mt-5 sm:max-w-xs">
            <label htmlFor="iv-role" className="block text-xs font-medium mb-1.5">Target role</label>
            <Select id="iv-role" value={role} onChange={(e) => setRole(e.target.value as RoleId)}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>

          <p className="text-xs font-medium mt-5 mb-1.5">Interview type</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {INTERVIEW_TYPES.map((t) => {
              const size = interviewPool(role, t.id).length;
              return (
                <button key={t.id} type="button" aria-pressed={type === t.id} onClick={() => setType(t.id)} disabled={!size}
                  className={cn("rounded-lg border p-3.5 text-left disabled:opacity-50", type === t.id ? "border-accent bg-accent-soft/50" : "border-border hover:bg-surface-muted")}>
                  <span className="flex items-center justify-between gap-2 text-sm font-medium">{t.label}<span className="text-[11px] font-normal text-muted">{size} question{size === 1 ? "" : "s"}</span></span>
                  <span className="block text-xs text-muted mt-1">{t.desc}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-medium mt-5 mb-1.5">Number of questions</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map((c) => (
              <button key={c} type="button" aria-pressed={count === c} disabled={c > pool.length} onClick={() => setCount(c)} className={cn("rounded-lg border px-3.5 py-2 text-sm font-medium disabled:opacity-40", n === c ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-surface-muted")}>{c}</button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">{n} question{n === 1 ? "" : "s"} drawn at random from {pool.length} available for {ROLE_MAP[role].short} · allow about {n * 6} minutes.</p>

          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-5"><Button onClick={begin} disabled={!n}><Play size={14} /> Start interview</Button></div>
          {d.activeInterview && <p className="mt-2 text-xs text-muted">Starting a new interview replaces the one in progress.</p>}
        </Card>

        <Card className="p-5 h-fit">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={15} className="text-accent" /> How answers are scored</h2>
          <p className="text-xs text-muted mt-2 leading-relaxed">Each answer is scored 1–5 on five dimensions using countable signals in your text. The scorecard lists the signals it found, so you can see exactly why you got each score.</p>
          <ul className="mt-3 space-y-2.5">
            {RUBRIC.map((r) => (
              <li key={r.key}>
                <p className="text-xs font-medium flex items-center justify-between">{r.label}<span className="text-muted font-normal">{Math.round(r.weight * 100)}%</span></p>
                <p className="text-[11px] text-muted leading-relaxed">{r.desc}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-muted leading-relaxed border-t border-border pt-3">This is rule-based practice feedback, not an AI assessment and not a measure of hiring readiness. It cannot check whether your facts are correct.</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Past mock interviews" />
        {history.length ? (
          <ul className="mt-3 divide-y divide-border">
            {history.map((i) => (
              <li key={i.id}>
                <Link href={`/interview/${i.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-muted">
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">{INTERVIEW_TYPES.find((t) => t.id === i.type)?.label} · {ROLE_MAP[i.roleId].short} {i.seeded && <SampleBadge />}</p>
                    <p className="text-xs text-muted mt-0.5">{fmtDate(i.at, { day: "numeric", month: "short", year: "numeric" })} · {i.answers.length} questions</p>
                  </div>
                  <Badge tone={scoreTone(i.overall)}>{i.overall}/100</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : <Empty icon={MessagesSquare} title="No mock interviews yet" desc="Your scorecards will be listed here so you can track improvement between attempts." />}
      </Card>
    </Page>
  );
}
