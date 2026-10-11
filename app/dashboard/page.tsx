"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Award, CalendarClock, CheckCircle2, Circle, CircleDot, Flame, History, ListChecks, Target, TrendingUp } from "lucide-react";
import { useData } from "@/lib/cp/store";
import { achievements, readiness, recommendations, roadmapStats, streak, strengthsAndWeaknesses, topicPerformance } from "@/lib/cp/insights";
import { isOverdue } from "@/lib/cp/roadmap";
import { INTERVIEW_TYPES, roleName } from "@/lib/cp/content/roles";
import { fmtDate, fmtDuration, relTime } from "@/lib/cp/util";
import { Badge, Card, CardHeader, Empty, LinkButton, Page, PageHeader, Progress, SampleBadge, Stat, cn, scoreTone } from "@/components/cp/ui";
import { PrimaryRec, RecRow } from "@/components/cp/RecCard";
import { AccuracyBars } from "@/components/cp/charts";

export default function DashboardPage() {
  const d = useData();
  const rs = useMemo(() => roadmapStats(d), [d]);
  const recs = useMemo(() => recommendations(d), [d]);
  const st = useMemo(() => streak(d), [d]);
  const perf = useMemo(() => topicPerformance(d), [d]);
  const sw = useMemo(() => strengthsAndWeaknesses(d), [d]);
  const ready = useMemo(() => readiness(d), [d]);
  const earned = useMemo(() => achievements(d), [d]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const scores = [
    ...d.attempts.map((a) => ({ id: a.id, at: a.at, title: a.title, score: a.scorePct, unit: "%", href: `/practice/results/${a.id}`, seeded: a.seeded })),
    ...d.interviews.map((i) => ({ id: i.id, at: i.at, title: `Mock interview: ${INTERVIEW_TYPES.find((t) => t.id === i.type)?.label ?? i.type} round`, score: i.overall, unit: "/100", href: `/interview/${i.id}`, seeded: i.seeded })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  const recent = [...d.activity].reverse().slice(0, 6);

  return (
    <Page>
      <PageHeader
        eyebrow={fmtDate(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting}, ${d.profile.name.split(" ")[0]}`}
        subtitle={
          rs ? (
            <>Preparing for <span className="font-medium text-foreground">{roleName(d.profile.primaryRole)}</span> · week {rs.week} of {d.roadmap!.weeks} · plan ends {fmtDate(rs.endDate, { day: "numeric", month: "long" })} ({rs.daysLeft} day{rs.daysLeft === 1 ? "" : "s"} left)</>
          ) : "Set up a roadmap to get started."
        }
        actions={<LinkButton href="/roadmap" variant="secondary" size="sm">Open roadmap</LinkButton>}
      />

      <PrimaryRec rec={recs[0]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between"><p className="text-xs font-medium text-muted">Overall progress</p><Target size={15} className="text-muted" aria-hidden /></div>
          <p className="text-2xl font-semibold tracking-tight mt-1.5">{rs?.pct ?? 0}%</p>
          <div className="mt-2"><Progress value={rs?.pct ?? 0} label="Roadmap completion" /></div>
          <p className="text-xs text-muted mt-2">{rs?.completed ?? 0} of {rs?.total ?? 0} roadmap tasks</p>
        </Card>
        <Stat label="This week" icon={ListChecks} value={<>{rs?.weekCompleted ?? 0}<span className="text-base text-muted font-medium"> / {rs?.weekPlanned ?? 0}</span></>} sub={rs?.overdue.length ? `${rs.overdue.length} overdue from earlier` : "tasks completed of planned"} />
        <Stat label="Study streak" icon={Flame} value={<>{st.current}<span className="text-base text-muted font-medium"> day{st.current === 1 ? "" : "s"}</span></>} sub={st.activeToday ? `Active today · best ${st.longest}` : st.current ? "Study today to keep it going" : `Best so far: ${st.longest}`} />
        <Stat
          label="Readiness indicator" icon={TrendingUp}
          value={ready.score !== null ? <>{ready.score}<span className="text-base text-muted font-medium"> / 100</span></> : "—"}
          sub={<Link href="/progress#readiness" className="hover:underline">{ready.score !== null ? `${ready.band} · how it is calculated` : "Needs two of three inputs"}</Link>}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader title="Upcoming tasks" desc="The next open items on your roadmap, in planned order." action={<Link href="/roadmap" className="text-xs font-medium text-accent hover:underline">View all</Link>} />
          {rs && rs.upcoming.length ? (
            <ul className="mt-3 divide-y divide-border">
              {rs.upcoming.slice(0, 5).map((t) => {
                const late = isOverdue(t);
                return (
                  <li key={t.id}>
                    <Link href={`/roadmap?task=${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted transition-colors">
                      {t.status === "in_progress" ? <CircleDot size={16} className="text-accent shrink-0" aria-label="In progress" /> : <Circle size={16} className="text-muted shrink-0" aria-label="Not started" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted mt-0.5">Week {t.week} · {t.topic} · {fmtDuration(t.durationMin)}</p>
                      </div>
                      <Badge tone={late ? "danger" : "neutral"}><CalendarClock size={11} aria-hidden />{late ? "Overdue" : fmtDate(t.dueDate)}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty icon={CheckCircle2} title="Nothing left on your roadmap" desc="Every planned task is complete. Keep your interview answers sharp with regular mocks." action={<LinkButton href="/interview" size="sm">Start a mock interview</LinkButton>} />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Strengths and weak topics" desc="From your practice answers. Topics need 3+ answers to be classified." action={<Link href="/progress" className="text-xs font-medium text-accent hover:underline">Details</Link>} />
          {perf.length ? (
            <div className="p-5 pt-4 space-y-4">
              <AccuracyBars rows={perf.slice(0, 6).map((t) => ({ label: t.topic, value: t.pct, note: `${t.answered} answered`, muted: !t.reliable }))} />
              <div className="flex flex-wrap gap-1.5">
                {sw.strong.map((t) => <Badge key={t.topic} tone="success">Strong: {t.topic}</Badge>)}
                {sw.weak.map((t) => <Badge key={t.topic} tone="danger">Weak: {t.topic}</Badge>)}
                {!sw.strong.length && !sw.weak.length && <span className="text-xs text-muted">Not enough answers yet to classify topics.</span>}
              </div>
            </div>
          ) : (
            <Empty icon={ListChecks} title="No practice data yet" desc="Complete a practice set and your topic accuracy will appear here." action={<LinkButton href="/practice" size="sm">Go to practice</LinkButton>} />
          )}
        </Card>
      </div>

      {recs.length > 1 && (
        <Card>
          <CardHeader title="More suggestions" desc="Generated by rules from your roadmap, scores and activity — each one says why." />
          <ul className="mt-2 divide-y divide-border">{recs.slice(1, 4).map((r) => <RecRow key={r.ruleId} rec={r} />)}</ul>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Recent scores" />
          {scores.length ? (
            <ul className="mt-3 divide-y divide-border">
              {scores.map((s) => (
                <li key={s.id}>
                  <Link href={s.href} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{s.title}</p>
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-2">{relTime(s.at)} {s.seeded && <SampleBadge />}</p>
                    </div>
                    <Badge tone={scoreTone(s.score)}>{s.score}{s.unit}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty icon={ListChecks} title="No scores yet" desc="Scores from practice sets and mock interviews will be listed here." />}
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          {recent.length ? (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((a) => {
                const body = (
                  <>
                    <p className="text-sm truncate">{a.label}</p>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-2">{relTime(a.at)}{a.minutes > 0 && ` · ${fmtDuration(a.minutes)}`} {a.seeded && <SampleBadge />}</p>
                  </>
                );
                return <li key={a.id}>{a.href ? <Link href={a.href} className="block px-5 py-3 hover:bg-surface-muted">{body}</Link> : <div className="px-5 py-3">{body}</div>}</li>;
              })}
            </ul>
          ) : <Empty icon={History} title="No activity yet" desc="Start your first roadmap task and it will show up here." />}
        </Card>

        <Card>
          <CardHeader title="Achievements" desc={`${earned.filter((a) => a.earned).length} of ${earned.length} earned`} />
          <ul className="p-5 pt-4 grid grid-cols-2 gap-2">
            {earned.map((a) => (
              <li key={a.id} title={a.desc} className={cn("rounded-lg border px-3 py-2.5", a.earned ? "border-accent/30 bg-accent-soft/50" : "border-border opacity-60")}>
                <p className="flex items-center gap-1.5 text-xs font-medium"><Award size={13} className={a.earned ? "text-accent" : "text-muted"} aria-hidden />{a.title}</p>
                <p className="text-[11px] text-muted mt-1 leading-snug">{a.desc}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
