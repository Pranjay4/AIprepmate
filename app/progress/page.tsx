"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, Clock, History, ListChecks, MessagesSquare, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { useData } from "@/lib/cp/store";
import { readiness, recommendations, roadmapStats, studyMinutesByDay, topicPerformance, weeklyPlanVsDone } from "@/lib/cp/insights";
import { INTERVIEW_TYPES } from "@/lib/cp/content/roles";
import { addDays, avg, dayKey, diffDays, fmtDate, fmtDuration, relTime } from "@/lib/cp/util";
import { Badge, Card, CardHeader, Empty, LinkButton, Page, PageHeader, Progress, SampleBadge, Segmented, Stat, scoreTone } from "@/components/cp/ui";
import { AccuracyBars, MinutesBars, PlanBars, ScoreLine } from "@/components/cp/charts";
import { RecRow } from "@/components/cp/RecCard";

type Range = "7" | "14" | "30" | "all";

export default function ProgressPage() {
  const d = useData();
  const [range, setRange] = useState<Range>("14");
  const since = range === "all" ? undefined : addDays(dayKey(), -Number(range) + 1);
  const inRange = (iso: string) => !since || dayKey(iso) >= since;

  const rs = useMemo(() => roadmapStats(d), [d]);
  const ready = useMemo(() => readiness(d), [d]);
  const recs = useMemo(() => recommendations(d), [d]);
  const plan = useMemo(() => weeklyPlanVsDone(d), [d]);
  const firstDay = d.activity.length ? dayKey(d.activity[0].at) : dayKey();
  const span = range === "all" ? Math.min(90, Math.max(7, diffDays(firstDay, dayKey()) + 1)) : Number(range);
  const minutes = useMemo(() => studyMinutesByDay(d, span), [d, span]);
  const totalMin = minutes.reduce((s, m) => s + m.minutes, 0);
  const activeDays = minutes.filter((m) => m.minutes > 0).length;
  const attempts = d.attempts.filter((a) => inRange(a.at));
  const interviews = d.interviews.filter((i) => inRange(i.at));
  const perf = useMemo(() => topicPerformance(d, since), [d, since]);
  const reliable = perf.filter((t) => t.reliable);
  const strongest = reliable[0];
  const weakest = reliable.length > 1 ? reliable[reliable.length - 1] : undefined;
  const recent = [...d.activity].reverse().filter((a) => inRange(a.at)).slice(0, 8);
  const rangeLabel = range === "all" ? "all time" : `last ${range} days`;

  return (
    <Page>
      <PageHeader
        eyebrow="Progress and readiness"
        title="Progress"
        subtitle="Everything here is calculated from your own roadmap, practice answers, mock interviews and logged study time."
        actions={<Segmented label="Date range" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }, { value: "all", label: "All time" }]} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Roadmap completion" icon={Target} value={`${rs?.pct ?? 0}%`} sub={rs ? `${rs.completed} of ${rs.total} tasks` : "No roadmap yet"} />
        <Stat label="Planned vs completed to date" icon={ListChecks} value={rs ? <>{rs.completedOfPlannedToDate}<span className="text-base text-muted font-medium"> / {rs.plannedToDate}</span></> : "—"} sub={rs?.overdue.length ? `${rs.overdue.length} overdue` : "tasks due by today"} />
        <Stat label={`Study time · ${rangeLabel}`} icon={Clock} value={fmtDuration(totalMin)} sub={`${activeDays} active day${activeDays === 1 ? "" : "s"}`} />
        <Stat label={`Practice average · ${rangeLabel}`} icon={BarChart3} value={attempts.length ? `${Math.round(avg(attempts.map((a) => a.scorePct)))}%` : "—"} sub={attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}` : "No attempts in this period"} />
      </div>

      <Card id="readiness" className="scroll-mt-20">
        <CardHeader title="Readiness indicator" desc="A simple, explainable summary of your preparation inputs — not a prediction." action={<ShieldCheck size={16} className="text-accent" aria-hidden />} />
        <div className="p-5 pt-4 grid lg:grid-cols-[220px_1fr] gap-6">
          <div className="rounded-xl bg-surface-muted p-5 text-center h-fit">
            <p className="text-4xl font-semibold tracking-tight">{ready.score ?? "—"}{ready.score !== null && <span className="text-lg text-muted">/100</span>}</p>
            <Badge tone={ready.score === null ? "neutral" : scoreTone(ready.score)} className="mt-2">{ready.band}</Badge>
            {ready.score === null && <p className="text-xs text-muted mt-2 leading-relaxed">At least two of the three inputs are needed.{ready.provisional !== null && ` Based on one input alone it would read ${ready.provisional}.`}</p>}
          </div>
          <div>
            <ul className="space-y-3.5">
              {ready.parts.map((p) => (
                <li key={p.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{p.label} <span className="text-xs font-normal text-muted">· weight {Math.round(p.weight * 100)}%</span></span>
                    <span className="font-semibold tabular-nums">{p.value === null ? <span className="text-muted font-normal">No data — excluded</span> : `${p.value}%`}</span>
                  </div>
                  <div className="mt-1.5"><Progress value={p.value ?? 0} label={p.label} /></div>
                  <p className="text-[11px] text-muted mt-1">{p.basis}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted leading-relaxed border-t border-border pt-3">
              <strong className="font-semibold text-foreground">How it is calculated:</strong> a weighted average of the inputs that have data. Inputs with no data are left out and the remaining weights are scaled up, so a missing assessment is never counted as zero. Bands: under 40 early stage, 40–64 building, 65–79 on track, 80+ strong.
              {" "}<strong className="font-semibold text-foreground">What it is not:</strong> it does not predict placement results or guarantee selection, and it cannot see anything you do outside CampusPrep.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Planned vs completed tasks" desc="Per roadmap week." />
          <div className="p-5 pt-3">{plan.length ? <PlanBars data={plan} /> : <Empty icon={Target} title="No roadmap yet" desc="Generate a roadmap to see planned and completed tasks." action={<LinkButton href="/onboarding" size="sm">Set up roadmap</LinkButton>} />}</div>
        </Card>
        <Card>
          <CardHeader title="Study time" desc="Minutes logged per day. Practice and interviews use measured time; lessons and manually completed tasks use their estimated duration." />
          <div className="p-5 pt-3">
            {totalMin > 0 ? <MinutesBars data={minutes.map((m) => ({ label: fmtDate(m.day), minutes: m.minutes }))} /> : <Empty icon={Clock} title="No study time in this period" desc="Complete a task, practice set or mock interview to log time." />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Practice scores across attempts" desc={`${attempts.length} attempt${attempts.length === 1 ? "" : "s"} · ${rangeLabel}`} />
          <div className="p-5 pt-3">
            {attempts.length >= 2 ? <ScoreLine name="Score (%)" data={attempts.map((a, i) => ({ label: `#${i + 1} · ${fmtDate(a.at)}`, score: a.scorePct }))} />
              : attempts.length === 1 ? <p className="text-sm text-muted py-6">One attempt so far: <strong className="text-foreground">{attempts[0].scorePct}%</strong> on “{attempts[0].title}”. A trend appears after two attempts.</p>
              : <Empty icon={ListChecks} title="No practice attempts in this period" desc="Scores appear here after you submit a practice session." action={<LinkButton href="/practice" size="sm">Start practising</LinkButton>} />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Mock interview scores" desc={`${interviews.length} interview${interviews.length === 1 ? "" : "s"} · ${rangeLabel}`} />
          <div className="p-5 pt-3">
            {interviews.length >= 2 ? <ScoreLine name="Score (/100)" data={interviews.map((a, i) => ({ label: `#${i + 1} · ${INTERVIEW_TYPES.find((t) => t.id === a.type)?.label}`, score: a.overall }))} />
              : interviews.length === 1 ? (
                <div className="py-4">
                  <p className="text-sm text-muted">One mock interview so far — a trend appears after two.</p>
                  <Link href={`/interview/${interviews[0].id}`} className="mt-3 flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-surface-muted">
                    <span className="text-sm font-medium flex items-center gap-2">{INTERVIEW_TYPES.find((t) => t.id === interviews[0].type)?.label} round · {fmtDate(interviews[0].at)} {interviews[0].seeded && <SampleBadge />}</span>
                    <Badge tone={scoreTone(interviews[0].overall)}>{interviews[0].overall}/100</Badge>
                  </Link>
                </div>
              ) : <Empty icon={MessagesSquare} title="No mock interviews in this period" desc="Interview results feed the readiness indicator once you have one." action={<LinkButton href="/interview" size="sm">Start a mock interview</LinkButton>} />}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Topic-level performance" desc={`Accuracy on answered questions · ${rangeLabel}. Faded bars have fewer than 3 answers and are not classified.`} />
        {perf.length ? (
          <div className="p-5 pt-4 grid lg:grid-cols-[1fr_260px] gap-6">
            <AccuracyBars rows={perf.map((t) => ({ label: t.topic, value: t.pct, note: `${t.answered} answered`, muted: !t.reliable }))} />
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><TrendingUp size={13} /> Strongest topic</p>
                <p className="text-sm font-semibold mt-1">{strongest ? `${strongest.topic} · ${strongest.pct}%` : "Not enough data"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-muted">Weakest topic</p>
                <p className="text-sm font-semibold mt-1">{weakest ? `${weakest.topic} · ${weakest.pct}%` : "Not enough data"}</p>
                {weakest && <Link href={`/practice?topic=${encodeURIComponent(weakest.topic)}`} className="text-xs text-accent hover:underline mt-1.5 inline-block">Practise {weakest.topic}</Link>}
              </div>
            </div>
          </div>
        ) : <Empty icon={BarChart3} title="No answers in this period" desc="Topic accuracy is built from every question you answer in quizzes and practice sessions." />}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recommended next steps" desc="Rule-based, with the reason for each." />
          <ul className="mt-2 divide-y divide-border">{recs.slice(0, 4).map((r) => <RecRow key={r.ruleId} rec={r} />)}</ul>
        </Card>
        <Card>
          <CardHeader title="Recent activity" desc={rangeLabel} />
          {recent.length ? (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    {a.href ? <Link href={a.href} className="text-sm truncate block hover:text-accent hover:underline">{a.label}</Link> : <p className="text-sm truncate">{a.label}</p>}
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-2">{relTime(a.at)} {a.seeded && <SampleBadge />}</p>
                  </div>
                  {a.minutes > 0 && <span className="text-xs text-muted shrink-0">{fmtDuration(a.minutes)}</span>}
                </li>
              ))}
            </ul>
          ) : <Empty icon={History} title="No activity in this period" desc="Try a wider date range, or start your next roadmap task." />}
        </Card>
      </div>
    </Page>
  );
}
