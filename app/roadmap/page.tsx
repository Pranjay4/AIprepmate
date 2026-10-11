"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  BookOpen, CalendarClock, CalendarDays, Check, CheckCircle2, Circle, CircleDot, Clock, ListChecks, Map, MessagesSquare,
  PartyPopper, SlidersHorizontal, Target,
} from "lucide-react";
import type { RoadmapTask, TaskStatus, TimelineWeeks } from "@/lib/cp/types";
import { rescheduleOverdueTasks, setTaskStatus, startPractice, trackDaily, updatePlan, useData } from "@/lib/cp/store";
import { roadmapStats } from "@/lib/cp/insights";
import { isOverdue, plannedMinutes, roadmapEndDate } from "@/lib/cp/roadmap";
import { MODULE_MAP } from "@/lib/cp/content/modules";
import { DIFFICULTIES, INTERVIEW_TYPES, roleName } from "@/lib/cp/content/roles";
import { addDays, dayKey, fmtDate, fmtDuration } from "@/lib/cp/util";
import {
  Badge, Button, Card, DifficultyBadge, Empty, LinkButton, Modal, Notice, Page, PageHeader, Progress, SampleBadge, Segmented,
  Select, STATUS_LABEL, StatusBadge, cn, scoreTone,
} from "@/components/cp/ui";
import { BudgetNote, MinutesPicker, TimelinePicker } from "@/components/cp/PlanFields";

export default function RoadmapPage() {
  return (
    <Suspense>
      <Roadmap />
    </Suspense>
  );
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "completed") return <CheckCircle2 size={18} className="text-success" aria-hidden />;
  if (status === "in_progress") return <CircleDot size={18} className="text-accent" aria-hidden />;
  return <Circle size={18} className="text-muted" aria-hidden />;
}

function Roadmap() {
  const d = useData();
  const router = useRouter();
  const params = useSearchParams();
  const r = d.roadmap;
  const rs = useMemo(() => roadmapStats(d), [d]);
  const [view, setView] = useState<"checklist" | "timeline">("checklist");
  const [week, setWeek] = useState("all");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [adjust, setAdjust] = useState(false);

  useEffect(() => {
    trackDaily("roadmap_viewed");
  }, []);

  if (!r || !rs) {
    return (
      <Page>
        <PageHeader title="Roadmap" />
        <Card><Empty icon={Map} title="No roadmap yet" desc="Choose a target role, timeline and daily time to generate your weekly plan." action={<LinkButton href="/onboarding">Set up roadmap</LinkButton>} /></Card>
      </Page>
    );
  }

  const openTask = r.tasks.find((t) => t.id === params.get("task")) ?? null;
  const rescheduleOpen = params.get("reschedule") === "1";
  const isNew = params.get("new") === "1";
  const close = () => router.replace("/roadmap", { scroll: false });
  const open = (id: string) => router.replace(`/roadmap?task=${id}`, { scroll: false });

  const topics = [...new Set(r.tasks.map((t) => t.topic))];
  const filtered = r.tasks.filter(
    (t) =>
      (week === "all" || t.week === Number(week)) &&
      (topic === "all" || t.topic === topic) &&
      (difficulty === "all" || t.difficulty === difficulty) &&
      (status === "all" || (status === "overdue" ? isOverdue(t) : t.status === status))
  );
  const filtersActive = week !== "all" || topic !== "all" || difficulty !== "all" || status !== "all";
  const weeks = Array.from({ length: r.weeks }, (_, i) => i + 1);
  const today = dayKey();

  return (
    <Page>
      <PageHeader
        eyebrow={roleName(r.roleId)}
        title="Your preparation roadmap"
        subtitle={<>{r.weeks} weeks · {fmtDate(r.startDate)} to {fmtDate(roadmapEndDate(r), { day: "numeric", month: "short", year: "numeric" })} · {fmtDuration(r.minutesPerDay)} a day · {fmtDuration(plannedMinutes(r))} planned in total</>}
        actions={
          <>
            {rs.overdue.length > 0 && <Button variant="secondary" size="sm" onClick={() => router.replace("/roadmap?reschedule=1", { scroll: false })}><CalendarClock size={14} /> Reschedule {rs.overdue.length} overdue</Button>}
            <Button variant="secondary" size="sm" onClick={() => setAdjust(true)}><SlidersHorizontal size={14} /> Adjust plan</Button>
          </>
        }
      />

      {isNew && (
        <Notice tone="success" icon={PartyPopper}>
          <strong className="font-semibold">Your roadmap is ready.</strong> It has {r.tasks.length} tasks across {r.weeks} weeks, built for {roleName(r.roleId)}.
          {r.droppedCount > 0 && ` ${r.droppedCount} optional task(s) were left out to fit your available time — add time under Adjust plan to include them.`} Start with the first task in week 1.
        </Notice>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-sm"><span className="font-semibold">{rs.pct}% complete</span> <span className="text-muted">· {rs.completed} of {rs.total} tasks · {rs.inProgress} in progress{rs.overdue.length ? ` · ${rs.overdue.length} overdue` : ""}</span></p>
          <p className="text-xs text-muted">Week {rs.week} of {r.weeks}: {rs.weekCompleted} of {rs.weekPlanned} planned tasks done</p>
        </div>
        <div className="mt-3"><Progress value={rs.pct} label="Roadmap completion" /></div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Roadmap view" value={view} onChange={setView} options={[{ value: "checklist", label: "Weekly checklist" }, { value: "timeline", label: "Calendar" }]} />
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <Select aria-label="Filter by week" value={week} onChange={(e) => setWeek(e.target.value)} className="sm:w-32">
            <option value="all">All weeks</option>
            {weeks.map((w) => <option key={w} value={w}>Week {w}</option>)}
          </Select>
          <Select aria-label="Filter by topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="sm:w-44">
            <option value="all">All topics</option>
            {topics.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select aria-label="Filter by difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="sm:w-36">
            <option value="all">All levels</option>
            {DIFFICULTIES.map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-36">
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            <option value="overdue">Overdue</option>
          </Select>
        </div>
      </div>

      {!filtered.length ? (
        <Card>
          <Empty icon={ListChecks} title="No tasks match these filters" desc="Try widening the week, topic, difficulty or status filter."
            action={<Button variant="secondary" size="sm" onClick={() => { setWeek("all"); setTopic("all"); setDifficulty("all"); setStatus("all"); }}>Clear filters</Button>} />
        </Card>
      ) : view === "checklist" ? (
        <div className="space-y-5">
          {weeks.filter((w) => filtered.some((t) => t.week === w)).map((w) => {
            const all = r.tasks.filter((t) => t.week === w);
            const shown = filtered.filter((t) => t.week === w);
            const done = all.filter((t) => t.status === "completed").length;
            const from = addDays(r.startDate, (w - 1) * 7);
            return (
              <Card key={w}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
                  <div>
                    <h2 className="text-sm font-semibold flex items-center gap-2">Week {w} {w === rs.week && <Badge tone="accent">Current week</Badge>}</h2>
                    <p className="text-xs text-muted mt-0.5">{fmtDate(from)} – {fmtDate(addDays(from, 6))} · {fmtDuration(all.reduce((s, t) => s + t.durationMin, 0))} planned{filtersActive && ` · showing ${shown.length} of ${all.length}`}</p>
                  </div>
                  <div className="w-36">
                    <p className="text-xs text-muted text-right mb-1">{done} of {all.length} done</p>
                    <Progress value={all.length ? (done / all.length) * 100 : 0} tone={done === all.length ? "success" : "accent"} label={`Week ${w} completion`} />
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {shown.map((t) => <TaskRow key={t.id} task={t} onOpen={() => open(t.id)} />)}
                </ul>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 text-[11px] text-muted mb-1.5">
              <span />
              {Array.from({ length: 7 }, (_, i) => <span key={i} className="px-1">{fmtDate(addDays(r.startDate, i), { weekday: "short" })}</span>)}
            </div>
            {weeks.filter((w) => week === "all" || Number(week) === w).map((w) => (
              <div key={w} className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 mb-1.5">
                <div className="text-xs font-medium pt-2">Week {w}</div>
                {Array.from({ length: 7 }, (_, i) => {
                  const day = addDays(r.startDate, (w - 1) * 7 + i);
                  const items = filtered.filter((t) => t.dueDate === day);
                  return (
                    <div key={i} className={cn("min-h-[84px] rounded-lg border p-1.5 space-y-1", day === today ? "border-accent bg-accent-soft/40" : "border-border bg-background")}>
                      <p className={cn("text-[10px]", day === today ? "text-accent font-semibold" : "text-muted")}>{fmtDate(day)}{day === today && " · Today"}</p>
                      {items.map((t) => (
                        <button key={t.id} type="button" onClick={() => open(t.id)} title={`${t.title} — ${STATUS_LABEL[t.status]}`}
                          className={cn("w-full text-left rounded-md border px-1.5 py-1 text-[11px] leading-snug hover:border-accent",
                            t.status === "completed" ? "border-border bg-success-soft text-foreground/70 line-through decoration-foreground/30" : isOverdue(t) ? "border-danger/40 bg-danger-soft" : "border-border bg-surface")}>
                          <span className="line-clamp-2">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            <p className="text-[11px] text-muted mt-3">Tasks are placed on their planned date. Green = completed, red = overdue. Day seven of each week is left free.</p>
          </div>
        </Card>
      )}

      <TaskDialog task={openTask} onClose={close} />

      <Modal
        open={rescheduleOpen} onClose={close} title="Reschedule overdue tasks"
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button disabled={!rs.overdue.length} onClick={() => { rescheduleOverdueTasks(); close(); }}>Reschedule {rs.overdue.length} task{rs.overdue.length === 1 ? "" : "s"}</Button></>}
      >
        {rs.overdue.length ? (
          <>
            <p className="text-sm text-muted leading-relaxed">These tasks are past their planned date. Rescheduling moves them forward from today, filling each day up to your {fmtDuration(r.minutesPerDay)} daily budget. Other tasks keep their dates.</p>
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
              {rs.overdue.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{t.title}</span>
                  <span className="text-xs text-muted shrink-0">was due {fmtDate(t.dueDate)} · {fmtDuration(t.durationMin)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="text-sm text-muted">Nothing is overdue — your plan is up to date.</p>}
      </Modal>

      {adjust && <AdjustPlan onClose={() => setAdjust(false)} />}
    </Page>
  );
}

function TaskRow({ task: t, onOpen }: { task: RoadmapTask; onOpen: () => void }) {
  const late = isOverdue(t);
  const next: TaskStatus = t.status === "completed" ? "not_started" : "completed";
  return (
    <li className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
      <button type="button" onClick={() => setTaskStatus(t.id, next)} aria-label={t.status === "completed" ? `Mark "${t.title}" as not started` : `Mark "${t.title}" as completed`} title={t.status === "completed" ? "Mark as not started" : "Mark as completed"} className="mt-0.5 rounded-full hover:opacity-70">
        <StatusIcon status={t.status} />
      </button>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left group">
        <p className={cn("text-sm font-medium group-hover:text-accent", t.status === "completed" && "text-muted line-through decoration-muted/50")}>{t.title}</p>
        <p className="text-xs text-muted mt-0.5 line-clamp-1">{t.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge>{t.topic}</Badge>
          <DifficultyBadge value={t.difficulty} />
          <Badge><Clock size={11} aria-hidden />{fmtDuration(t.durationMin)}</Badge>
          {t.status === "in_progress" && <StatusBadge value="in_progress" />}
          {late ? <Badge tone="danger">Overdue · was {fmtDate(t.dueDate)}</Badge> : t.status !== "completed" && <Badge>Due {fmtDate(t.dueDate)}</Badge>}
          {t.score !== undefined && <Badge tone={scoreTone(t.score)}>Score {t.score}%</Badge>}
          {t.completedAt && <span className="text-[11px] text-muted">Completed {fmtDate(t.completedAt)}</span>}
          {t.seeded && <SampleBadge />}
        </div>
      </button>
    </li>
  );
}

function TaskDialog({ task: t, onClose }: { task: RoadmapTask | null; onClose: () => void }) {
  const d = useData();
  const router = useRouter();
  const [error, setError] = useState("");
  if (!t) return null;
  const m = t.moduleId ? MODULE_MAP[t.moduleId] : null;
  const mProg = m ? d.modules[m.id] : undefined;
  const ivLabel = t.interviewType ? INTERVIEW_TYPES.find((x) => x.id === t.interviewType)?.label : null;

  function practise() {
    if (!t?.practice) return;
    const ok = startPractice({
      title: t.title, role: d.roadmap?.roleId ?? null, topics: t.practice.topics, types: t.practice.types, count: t.practice.count,
      timed: t.practice.timed, source: { type: "task", id: t.id },
      // Lesson-backed tasks complete through the lesson quiz; practice-only tasks complete on submission.
      taskId: m ? undefined : t.id,
    });
    if (ok) router.push("/practice/session");
    else setError("No questions are available for this topic yet. You can mark the task complete manually.");
  }

  return (
    <Modal open onClose={onClose} title={t.title} wide
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" role="group" aria-label="Task status">
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setTaskStatus(t.id, s)} aria-pressed={t.status === s}
                className={cn("rounded-md border px-2.5 py-1.5 text-xs font-medium", t.status === s ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-foreground")}>
                {s === "completed" && t.status === s && <Check size={11} className="inline mr-1" />}{STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">Week {t.week} · {t.phase}</Badge>
        <Badge>{t.topic}</Badge>
        <DifficultyBadge value={t.difficulty} />
        <Badge><Clock size={11} aria-hidden />{fmtDuration(t.durationMin)}</Badge>
        <Badge tone={isOverdue(t) ? "danger" : "neutral"}><CalendarDays size={11} aria-hidden />{isOverdue(t) ? "Overdue · " : "Due "}{fmtDate(t.dueDate)}</Badge>
        {t.seeded && <SampleBadge />}
      </div>
      <p className="text-sm text-muted mt-3 leading-relaxed">{t.description}</p>

      {(t.score !== undefined || t.completedAt) && (
        <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-surface-muted px-4 py-3 text-sm">
          {t.score !== undefined && <span>Score: <strong>{t.score}%</strong></span>}
          {t.completedAt && <span>Completed: <strong>{fmtDate(t.completedAt, { day: "numeric", month: "short", year: "numeric" })}</strong></span>}
        </div>
      )}

      <h3 className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Target size={13} /> Learning objective</h3>
      <p className="text-sm mt-1.5">{t.objective}</p>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">{m ? "What this lesson covers" : "Key points"}</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {t.notes.map((n) => <li key={n} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />{n}</li>)}
      </ul>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Activities</h3>
      <div className="mt-2 space-y-2">
        {m && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium"><BookOpen size={15} className="text-accent" />Lesson: {m.title}</p>
              <p className="text-xs text-muted mt-0.5">{fmtDuration(m.durationMin)} · {m.sections.length} sections, an exercise and a quiz. Submitting the quiz completes this task.{mProg?.quizScore !== undefined && ` Last quiz: ${mProg.quizScore}%.`}</p>
            </div>
            <LinkButton href={`/learn/${m.id}`} size="sm">{mProg?.status === "completed" ? "Review lesson" : mProg ? "Continue lesson" : "Start lesson"}</LinkButton>
          </div>
        )}
        {t.practice && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium"><ListChecks size={15} className="text-accent" />{m ? "Related practice" : "Practice activity"}</p>
              <p className="text-xs text-muted mt-0.5">
                Up to {t.practice.count} questions · {t.practice.topics.includes("*") ? "all topics for your role" : t.practice.topics.length ? t.practice.topics.join(", ") : "your weakest topics"}{t.practice.timed && " · timed"}.{!m && " Submitting it completes this task."}
              </p>
            </div>
            <Button size="sm" variant={m ? "secondary" : "primary"} onClick={practise}>Start practice</Button>
          </div>
        )}
        {t.interviewType && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium"><MessagesSquare size={15} className="text-accent" />{ivLabel} mock interview</p>
              <p className="text-xs text-muted mt-0.5">Written answers scored against a five-part rubric. Submitting it completes this task.</p>
            </div>
            <LinkButton size="sm" href={`/interview?type=${t.interviewType}&task=${t.id}`}>Set up interview</LinkButton>
          </div>
        )}
        {!m && !t.practice && !t.interviewType && <p className="text-sm text-muted">Work through the key points above, then mark the task complete.</p>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      {d.activeSession && t.practice && <p className="mt-3 text-xs text-muted">Starting practice replaces your unfinished session “{d.activeSession.title}”. <Link href="/practice/session" className="text-accent hover:underline">Resume it instead</Link>.</p>}
    </Modal>
  );
}

function AdjustPlan({ onClose }: { onClose: () => void }) {
  const d = useData();
  const r = d.roadmap!;
  const [weeks, setWeeks] = useState<TimelineWeeks>(r.weeks);
  const [minutes, setMinutes] = useState(r.minutesPerDay);
  const changed = weeks !== r.weeks || minutes !== r.minutesPerDay;
  return (
    <Modal open onClose={onClose} title="Adjust your plan" wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!changed} onClick={() => { updatePlan({ targetRoles: d.profile.targetRoles, primaryRole: r.roleId, timelineWeeks: weeks, minutesPerDay: minutes }); onClose(); }}>Update roadmap</Button>
        </>
      }
    >
      <p className="text-sm text-muted leading-relaxed">Changing your timeline or daily time rebuilds the schedule from your original start date ({fmtDate(r.startDate)}). Completed and in-progress tasks keep their status. To change your target role, go to <Link href="/settings" className="text-accent hover:underline">Settings</Link>.</p>
      <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Timeline</h3>
      <TimelinePicker value={weeks} onChange={setWeeks} />
      <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Time per day</h3>
      <MinutesPicker value={minutes} onChange={setMinutes} />
      <div className="mt-4"><BudgetNote role={r.roleId} weeks={weeks} minutes={minutes} /></div>
    </Modal>
  );
}
