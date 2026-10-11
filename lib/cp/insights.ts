import type { MockInterview, PracticeAttempt, RoadmapTask, UserData } from "./types";
import { MODULE_MAP, moduleForTopic } from "./content/modules";
import { topicsForRole } from "./content/roles";
import { currentWeek, isOverdue, roadmapEndDate } from "./roadmap";
import { addDays, avg, dayKey, diffDays, fmtDate } from "./util";

// Every number shown in the UI is derived here from the user's stored records.

export function roadmapStats(d: UserData) {
  const r = d.roadmap;
  if (!r) return null;
  const today = dayKey();
  const week = currentWeek(r, today);
  const total = r.tasks.length;
  const completed = r.tasks.filter((t) => t.status === "completed").length;
  const inProgress = r.tasks.filter((t) => t.status === "in_progress").length;
  const thisWeek = r.tasks.filter((t) => t.week === week);
  const overdue = r.tasks.filter((t) => isOverdue(t, today));
  const upcoming = r.tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const endDate = roadmapEndDate(r);
  const dueSoFar = r.tasks.filter((t) => t.dueDate <= today);
  return {
    week,
    total,
    completed,
    inProgress,
    pct: total ? Math.round((completed / total) * 100) : 0,
    weekPlanned: thisWeek.length,
    weekCompleted: thisWeek.filter((t) => t.status === "completed").length,
    overdue,
    upcoming,
    endDate,
    daysLeft: Math.max(0, diffDays(today, endDate)),
    plannedToDate: dueSoFar.length,
    completedOfPlannedToDate: dueSoFar.filter((t) => t.status === "completed").length,
  };
}

export function weeklyPlanVsDone(d: UserData) {
  const r = d.roadmap;
  if (!r) return [];
  return Array.from({ length: r.weeks }, (_, i) => {
    const tasks = r.tasks.filter((t) => t.week === i + 1);
    return { week: `W${i + 1}`, Planned: tasks.length, Completed: tasks.filter((t) => t.status === "completed").length };
  });
}

/** Consecutive days with logged activity, counted back from today (or yesterday). */
export function streak(d: UserData) {
  const days = new Set(d.activity.filter((a) => a.kind !== "account").map((a) => dayKey(a.at)));
  const today = dayKey();
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of [...days].sort()) {
    run = prev && diffDays(prev, k) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  return { current, longest, activeToday: days.has(today), days };
}

export interface TopicPerf {
  topic: string;
  answered: number;
  pct: number;
  /** Fewer than 3 answers: shown, but not classified as strong or weak. */
  reliable: boolean;
}

export function topicPerformance(d: UserData, sinceDay?: string): TopicPerf[] {
  const agg = new Map<string, { n: number; s: number }>();
  for (const a of d.attempts) {
    if (sinceDay && dayKey(a.at) < sinceDay) continue;
    for (const r of a.responses) {
      if (r.answer === null) continue;
      const x = agg.get(r.topic) ?? { n: 0, s: 0 };
      x.n++;
      x.s += r.score;
      agg.set(r.topic, x);
    }
  }
  return [...agg.entries()]
    .map(([topic, x]) => ({ topic, answered: x.n, pct: Math.round((x.s / x.n) * 100), reliable: x.n >= 3 }))
    .sort((a, b) => b.pct - a.pct);
}

export function strengthsAndWeaknesses(d: UserData) {
  const perf = topicPerformance(d).filter((t) => t.reliable);
  return {
    strong: perf.filter((t) => t.pct >= 75),
    weak: perf.filter((t) => t.pct < 60).sort((a, b) => a.pct - b.pct),
  };
}

export function studyMinutesByDay(d: UserData, days: number) {
  const today = dayKey();
  const byDay = new Map<string, number>();
  for (const a of d.activity) byDay.set(dayKey(a.at), (byDay.get(dayKey(a.at)) ?? 0) + a.minutes);
  return Array.from({ length: days }, (_, i) => {
    const k = addDays(today, i - days + 1);
    return { day: k, minutes: Math.round(byDay.get(k) ?? 0) };
  });
}

export interface ReadinessPart {
  key: "roadmap" | "practice" | "interview";
  label: string;
  weight: number;
  value: number | null;
  basis: string;
}

/**
 * Explainable readiness indicator: a weighted average of the inputs that exist.
 * Missing inputs are excluded and the remaining weights are re-normalised —
 * a missing assessment is never treated as a zero.
 */
export function readiness(d: UserData) {
  const rs = roadmapStats(d);
  const recentAttempts = d.attempts.slice(-5);
  const recentInterviews = d.interviews.slice(-3);
  const parts: ReadinessPart[] = [
    {
      key: "roadmap", label: "Roadmap completion", weight: 0.4,
      value: rs ? rs.pct : null,
      basis: rs ? `${rs.completed} of ${rs.total} tasks completed` : "No roadmap yet",
    },
    {
      key: "practice", label: "Practice performance", weight: 0.35,
      value: recentAttempts.length ? Math.round(avg(recentAttempts.map((a) => a.scorePct))) : null,
      basis: recentAttempts.length ? `Average of your last ${recentAttempts.length} practice score(s)` : "No practice attempts yet",
    },
    {
      key: "interview", label: "Mock interview results", weight: 0.25,
      value: recentInterviews.length ? Math.round(avg(recentInterviews.map((i) => i.overall))) : null,
      basis: recentInterviews.length ? `Average of your last ${recentInterviews.length} mock interview(s)` : "No mock interviews yet",
    },
  ];
  const have = parts.filter((p) => p.value !== null);
  const wsum = have.reduce((s, p) => s + p.weight, 0);
  const score = have.length ? Math.round(have.reduce((s, p) => s + p.weight * (p.value as number), 0) / wsum) : null;
  const enough = have.length >= 2;
  const band =
    score === null || !enough ? "Not enough data"
    : score >= 80 ? "Strong"
    : score >= 65 ? "On track"
    : score >= 40 ? "Building"
    : "Early stage";
  return { score: enough ? score : null, provisional: score, band, parts, missing: parts.filter((p) => p.value === null) };
}

export interface Recommendation {
  ruleId: string;
  title: string;
  reason: string;
  cta: string;
  href: string;
  refType: "module" | "practice" | "interview" | "task";
  refId: string;
}

function taskHref(t: RoadmapTask) {
  return `/roadmap?task=${t.id}`;
}

/** Rule-based next-best-action engine. Rules are evaluated in priority order. */
export function recommendations(d: UserData): Recommendation[] {
  const out: Recommendation[] = [];
  const role = d.profile.primaryRole;
  const rs = roadmapStats(d);
  if (!d.roadmap || !rs || !role) {
    return [{
      ruleId: "setup", title: "Create your preparation roadmap",
      reason: "You have not chosen a target role and timeline yet, so there is no plan to follow.",
      cta: "Set up roadmap", href: "/onboarding", refType: "task", refId: "onboarding",
    }];
  }

  if (d.activeSession) {
    out.push({
      ruleId: "resume-practice", title: `Resume: ${d.activeSession.title}`,
      reason: `You have an unfinished practice session with ${Object.keys(d.activeSession.answers).length} of ${d.activeSession.questionIds.length} questions answered.`,
      cta: "Resume session", href: "/practice/session", refType: "practice", refId: d.activeSession.id,
    });
  }
  if (d.activeInterview) {
    out.push({
      ruleId: "resume-interview", title: "Resume your mock interview",
      reason: "You started a mock interview and have not submitted it yet.",
      cta: "Resume interview", href: "/interview/session", refType: "interview", refId: d.activeInterview.id,
    });
  }

  // Overdue work
  if (rs.overdue.length >= 3) {
    out.push({
      ruleId: "reschedule", title: `Reschedule ${rs.overdue.length} overdue tasks`,
      reason: `${rs.overdue.length} tasks are past their planned date. Spreading them over the coming days keeps the plan realistic.`,
      cta: "Review and reschedule", href: "/roadmap?reschedule=1", refType: "task", refId: "reschedule",
    });
  } else if (rs.overdue.length) {
    const t = rs.overdue[0];
    out.push({
      ruleId: "overdue", title: `Catch up: ${t.title}`,
      reason: `This task was planned for ${fmtDate(t.dueDate)} and is still open. It takes about ${t.durationMin} minutes.`,
      cta: "Open task", href: taskHref(t), refType: "task", refId: t.id,
    });
  }

  // Weak topics
  // Weak topics inside the target role are prioritised; weak topics outside it are
  // still surfaced, but after the next roadmap task.
  const allWeak = strengthsAndWeaknesses(d).weak;
  const roleTopics = topicsForRole(role);
  const weak = allWeak.filter((w) => roleTopics.includes(w.topic));
  const offRoleWeak = allWeak.filter((w) => !roleTopics.includes(w.topic));
  for (const w of weak.slice(0, 2)) {
    const m = moduleForTopic(w.topic, role);
    const prog = m ? d.modules[m.id] : undefined;
    if (m && (!prog || prog.status !== "completed" || (prog.quizScore ?? 100) < 60)) {
      out.push({
        ruleId: `weak-module:${w.topic}`, title: `Revise ${w.topic}: ${m.title}`,
        reason: `Your accuracy in ${w.topic} is ${w.pct}% across ${w.answered} answered questions. This lesson covers the fundamentals behind them.`,
        cta: "Open lesson", href: `/learn/${m.id}`, refType: "module", refId: m.id,
      });
    }
    out.push({
      ruleId: `weak-practice:${w.topic}`, title: `Targeted practice: ${w.topic}`,
      reason: `Your accuracy in ${w.topic} is ${w.pct}% across ${w.answered} answered questions — below the 60% mark used to flag weak topics.`,
      cta: "Start practice set", href: `/practice?topic=${encodeURIComponent(w.topic)}`, refType: "practice", refId: w.topic,
    });
  }

  // Repeated low behavioural / HR interview scores
  const soft = d.interviews.filter((i) => i.type === "behavioural" || i.type === "hr");
  const lowSoft = soft.filter((i) => i.overall < 60);
  if (lowSoft.length >= 2 && d.modules["common-star"]?.status !== "completed") {
    out.push({
      ruleId: "star", title: "Practise structured answers with STAR",
      reason: `${lowSoft.length} of your behavioural or HR mock interviews scored below 60. The STAR lesson includes an outline exercise.`,
      cta: "Open lesson", href: "/learn/common-star", refType: "module", refId: "common-star",
    });
  }
  const lastIv = d.interviews[d.interviews.length - 1];
  if (lastIv && lastIv.overall < 60 && lowSoft.length < 2) {
    out.push({
      ruleId: "retry-interview", title: "Retake a mock interview with the feedback applied",
      reason: `Your last mock interview scored ${lastIv.overall}/100. Applying one recommendation and retrying is the fastest way to improve.`,
      cta: "Start mock interview", href: `/interview?type=${lastIv.type}`, refType: "interview", refId: lastIv.type,
    });
  }

  // Completed a module but never practised the topic outside its quiz
  const practisedTopics = new Set(
    d.attempts.filter((a) => a.source.type !== "module").flatMap((a) => a.responses.map((r) => r.topic))
  );
  for (const [id, prog] of Object.entries(d.modules)) {
    const m = MODULE_MAP[id];
    if (m && prog.status === "completed" && !practisedTopics.has(m.topic)) {
      out.push({
        ruleId: `practise-after-module:${id}`, title: `Practise ${m.topic}`,
        reason: `You completed "${m.title}" but have not yet practised ${m.topic} questions outside the lesson quiz.`,
        cta: "Start practice set", href: `/practice?topic=${encodeURIComponent(m.topic)}`, refType: "practice", refId: m.topic,
      });
      break;
    }
  }

  // Next roadmap task
  const next = rs.upcoming.find((t) => !isOverdue(t)) ?? rs.upcoming[0];
  if (next) {
    out.push({
      ruleId: "next-task", title: `${next.status === "in_progress" ? "Continue" : "Next up"}: ${next.title}`,
      reason: rs.weekPlanned && rs.weekCompleted >= rs.weekPlanned
        ? `You have finished everything planned for week ${rs.week}. This is the next task on your roadmap.`
        : `It is the next open task in week ${next.week} of your roadmap, due ${fmtDate(next.dueDate)}.`,
      cta: next.status === "in_progress" ? "Continue task" : "Start task", href: taskHref(next), refType: "task", refId: next.id,
    });
  } else {
    out.push({
      ruleId: "all-done", title: "Roadmap complete — keep interview fluency up",
      reason: "Every task on your roadmap is complete. Regular mock interviews keep your answers sharp until placement day.",
      cta: "Start mock interview", href: "/interview", refType: "interview", refId: "any",
    });
  }

  for (const w of offRoleWeak.slice(0, 1)) {
    out.push({
      ruleId: `weak-practice:${w.topic}`, title: `Targeted practice: ${w.topic}`,
      reason: `Your accuracy in ${w.topic} is ${w.pct}% across ${w.answered} answered questions. It is outside the core topics for your target role, so it is listed after your roadmap work.`,
      cta: "Start practice set", href: `/practice?topic=${encodeURIComponent(w.topic)}`, refType: "practice", refId: w.topic,
    });
  }

  if (!d.interviews.length && rs.pct >= 30) {
    out.push({
      ruleId: "first-interview", title: "Try your first mock interview",
      reason: `You are ${rs.pct}% through your roadmap and have not attempted a mock interview, so interview results cannot yet feed your readiness indicator.`,
      cta: "Start mock interview", href: "/interview", refType: "interview", refId: "any",
    });
  }

  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.ruleId) ? false : (seen.add(r.ruleId), true)));
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  earned: boolean;
}

export function achievements(d: UserData): Achievement[] {
  const rs = roadmapStats(d);
  const st = streak(d);
  const modulesDone = Object.values(d.modules).filter((m) => m.status === "completed").length;
  return [
    { id: "roadmap", title: "Plan in place", desc: "Generated a preparation roadmap", earned: !!d.roadmap },
    { id: "first-task", title: "First step", desc: "Completed a roadmap task", earned: (rs?.completed ?? 0) >= 1 },
    { id: "module-3", title: "Steady learner", desc: "Completed 3 learning modules", earned: modulesDone >= 3 },
    { id: "practice-80", title: "Sharp set", desc: "Scored 80% or more in a practice session", earned: d.attempts.some((a) => a.scorePct >= 80) },
    { id: "interview-1", title: "In the hot seat", desc: "Completed a mock interview", earned: d.interviews.length >= 1 },
    { id: "streak-3", title: "Three-day streak", desc: "Studied 3 days in a row", earned: st.longest >= 3 },
    { id: "streak-7", title: "Seven-day streak", desc: "Studied 7 days in a row", earned: st.longest >= 7 },
    { id: "halfway", title: "Halfway there", desc: "Completed 50% of the roadmap", earned: (rs?.pct ?? 0) >= 50 },
  ];
}

export function practiceTrend(attempts: PracticeAttempt[]) {
  return attempts.map((a, i) => ({ n: i + 1, date: dayKey(a.at), score: a.scorePct, title: a.title, seeded: !!a.seeded }));
}

export function interviewTrend(interviews: MockInterview[]) {
  return interviews.map((a, i) => ({ n: i + 1, date: dayKey(a.at), score: a.overall, title: a.type, seeded: !!a.seeded }));
}

/**
 * Product metrics computed from this account's own event log.
 * Returns null for a metric when there is not enough data to compute it.
 */
export function productMetrics(d: UserData) {
  const ev = d.events;
  const has = (n: string) => ev.some((e) => e.name === n);
  const count = (n: string) => ev.filter((e) => e.name === n).length;
  const rs = roadmapStats(d);
  const started = count("practice_started");
  const recFollowed = count("recommendation_followed");
  const activeDays = [...new Set(ev.map((e) => dayKey(e.at)))].sort();
  const weeks = new Set(activeDays.map((k) => Math.floor(diffDays("2024-01-01", k) / 7)));
  // North Star: this week, did the learner complete a planned task AND improve on practice?
  const weekStart = addDays(dayKey(), -6);
  const tasksThisWeek = ev.filter((e) => e.name === "task_completed" && dayKey(e.at) >= weekStart).length;
  const scores = d.attempts.map((a) => a.scorePct);
  const recent = d.attempts.filter((a) => dayKey(a.at) >= weekStart).map((a) => a.scorePct);
  const earlier = d.attempts.filter((a) => dayKey(a.at) < weekStart).map((a) => a.scorePct);
  const improved = recent.length && earlier.length ? avg(recent) > avg(earlier) : recent.length >= 2 ? recent[recent.length - 1] > recent[0] : null;
  return {
    totalEvents: ev.length,
    seededEvents: ev.filter((e) => e.seeded).length,
    activated: has("onboarding_completed") && has("roadmap_generated") && (has("task_completed") || has("practice_submitted")),
    plannedCompletion: rs && rs.plannedToDate ? Math.round((rs.completedOfPlannedToDate / rs.plannedToDate) * 100) : null,
    practiceCompletion: started ? Math.min(100, Math.round((count("practice_submitted") / started) * 100)) : null,
    weakAreaActionRate: recFollowed ? Math.min(100, Math.round((count("recommended_task_completed") / recFollowed) * 100)) : null,
    recFollowed,
    activeDays: activeDays.length,
    activeWeeks: weeks.size,
    returned: count("session_returned"),
    northStar: { tasksThisWeek, improved, qualifies: tasksThisWeek > 0 && improved === true, attempts: scores.length },
    counts: Object.entries(
      ev.reduce<Record<string, number>>((m, e) => ((m[e.name] = (m[e.name] ?? 0) + 1), m), {})
    ).sort((a, b) => b[1] - a[1]),
  };
}
