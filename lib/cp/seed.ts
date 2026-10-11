import type { Activity, AnalyticsEvent, PracticeAttempt, Profile, Question, QuestionResponse, UserData } from "./types";
import { QUESTIONS, questionsForModule } from "./content/questions";
import { MODULE_MAP } from "./content/modules";
import { INTERVIEW_MAP } from "./content/interviews";
import { generateRoadmap } from "./roadmap";
import { evaluateAnswer, summariseInterview } from "./rubric";
import { scorePct } from "./grading";
import { addDays, dayKey, parseDay } from "./util";

export const DEMO_ID = "demo";

export function emptyUser(profile: Profile): UserData {
  return {
    version: 1,
    profile,
    roadmap: null,
    modules: {},
    attempts: [],
    interviews: [],
    saved: [],
    activity: [],
    events: [],
    reports: [],
    activeSession: null,
    activeInterview: null,
    followedRec: null,
    lastSeenAt: null,
  };
}

export function newProfile(id: string, name: string, email: string): Profile {
  return {
    id, name, email,
    institution: "", degree: "", gradYear: null,
    targetRoles: [], primaryRole: null,
    timelineWeeks: 4, minutesPerDay: 60,
    onboarded: false, theme: "system", isDemo: false, shareAggregates: false,
    createdAt: new Date().toISOString(),
  };
}

function at(day: string, hour: number, minute = 0): string {
  const d = parseDay(day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Deterministic sample responses: SQL is deliberately the weak topic. */
function sampleResponses(qs: Question[], offset: number): QuestionResponse[] {
  return qs.map((q, i) => {
    const k = i + offset;
    const sqlTopic = q.topic === "SQL" || q.topic === "DBMS & SQL";
    const correct = sqlTopic ? k % 5 === 0 || k % 5 === 2 : k % 5 !== 3;
    const answer =
      q.type === "mcq"
        ? correct ? (q.answer as number) : ((q.answer as number) + 1) % (q.options as string[]).length
        : correct ? (q.solution as string) : "SELECT * FROM orders";
    return { questionId: q.id, topic: q.topic, type: q.type, answer, correct, score: correct ? 1 : 0 };
  });
}

/**
 * Builds the demo account: a Business Analyst learner nine days into a four-week plan.
 * Every seeded record carries `seeded: true` so the UI can label it as sample data
 * and the learner can remove it from Settings.
 */
export function buildDemoUser(): UserData {
  const today = dayKey();
  const start = addDays(today, -9);
  const profile: Profile = {
    ...newProfile(DEMO_ID, "Demo Student", "demo@campusprep.local"),
    institution: "Demo Institute of Management",
    degree: "MBA / PGDM",
    gradYear: new Date().getFullYear() + 1,
    targetRoles: ["ba", "pm"],
    primaryRole: "ba",
    timelineWeeks: 4,
    minutesPerDay: 60,
    onboarded: true,
    isDemo: true,
    createdAt: at(start, 9),
  };
  const d = emptyUser(profile);
  const roadmap = generateRoadmap("ba", 4, 60, start);
  d.roadmap = roadmap;

  const activity: Activity[] = [];
  const events: AnalyticsEvent[] = [];
  let n = 0;
  const ev = (name: AnalyticsEvent["name"], iso: string, props?: AnalyticsEvent["props"]) =>
    events.push({ id: `seed_ev_${n++}`, at: iso, name, props, seeded: true });

  ev("signup_completed", at(start, 9));
  ev("role_selected", at(start, 9, 3), { role: "ba" });
  ev("onboarding_completed", at(start, 9, 5));
  ev("roadmap_generated", at(start, 9, 5), { role: "ba", weeks: 4 });
  ev("roadmap_viewed", at(start, 9, 6));

  // Study days relative to today: a 3-day run, a gap, then two more runs.
  const studyDays = [-9, -8, -7, -5, -4, -2, -1].map((o) => addDays(today, o));
  const due = roadmap.tasks.filter((t) => t.dueDate < today);
  const skipKey = "ba-metrics-drill"; // left open so the demo shows an overdue task
  const done = due.filter((t) => t.key !== skipKey).slice(0, 7);

  done.forEach((t, i) => {
    const day = studyDays[Math.min(i, studyDays.length - 1)];
    const startedIso = at(day, 18, 10);
    const doneIso = at(day, 19, 5);
    let score: number | undefined;
    ev("task_started", startedIso, { task: t.key });
    if (day !== start && i > 0 && studyDays[i - 1] !== day) ev("session_returned", at(day, 18));

    const qs = t.moduleId
      ? questionsForModule(t.moduleId)
      : t.practice
        ? QUESTIONS.filter(
            (q) => q.roles.includes("ba") && t.practice!.topics.includes(q.topic) &&
              (q.type === "mcq" || q.type === "sql") && (!t.practice!.types || t.practice!.types.includes(q.type))
          ).slice(0, t.practice.count)
        : [];
    if (qs.length) {
      const responses = sampleResponses(qs, i);
      score = scorePct(responses);
      const attempt: PracticeAttempt = {
        id: `seed_attempt_${i}`,
        at: doneIso,
        title: t.moduleId ? `Lesson quiz: ${MODULE_MAP[t.moduleId].title}` : t.title,
        source: t.moduleId ? { type: "module", id: t.moduleId } : { type: "task", id: t.id },
        roleId: "ba",
        durationSec: qs.length * 70,
        responses,
        scorePct: score,
        seeded: true,
      };
      d.attempts.push(attempt);
      ev("practice_started", startedIso, { source: attempt.source.type });
      ev("practice_submitted", doneIso, { score });
      ev("feedback_viewed", doneIso, { kind: "practice" });
    }
    if (t.moduleId) {
      d.modules[t.moduleId] = { status: "completed", startedAt: startedIso, completedAt: doneIso, quizScore: score, seeded: true };
    }
    t.status = "completed";
    t.startedAt = startedIso;
    t.completedAt = doneIso;
    t.score = score;
    t.seeded = true;
    ev("task_completed", doneIso, { task: t.key });
    activity.push({
      id: `seed_act_${i}`, at: doneIso, kind: t.moduleId ? "module" : "practice",
      label: `Completed: ${t.title}`, minutes: t.durationMin, href: `/roadmap?task=${t.id}`, seeded: true,
    });
  });

  // One task in progress.
  const open = roadmap.tasks.find((t) => t.status === "not_started" && t.key !== skipKey);
  if (open) {
    open.status = "in_progress";
    open.startedAt = at(addDays(today, -1), 20);
    open.seeded = true;
    if (open.moduleId) d.modules[open.moduleId] = { status: "in_progress", startedAt: open.startedAt, seeded: true };
    ev("task_started", open.startedAt, { task: open.key });
    ev("session_returned", open.startedAt);
    activity.push({
      id: "seed_act_open", at: open.startedAt, kind: "task", label: `Started: ${open.title}`,
      minutes: 15, href: `/roadmap?task=${open.id}`, seeded: true,
    });
  }

  // One HR mock interview, scored by the real rubric from deliberately average answers.
  const ivDay = addDays(today, -2);
  const answers = [
    evaluateAnswer(
      INTERVIEW_MAP["iv-hr-1"],
      "I am a final year MBA student interested in analytics. I did a project on sales data and an internship in a retail company where I worked on reports. I like working with numbers and I think this role is a good fit for my skills."
    ),
    evaluateAnswer(
      INTERVIEW_MAP["iv-hr-2"],
      "I want this role because I enjoy analysis. In my internship I built a weekly sales report in Excel that reduced manual work by about 3 hours a week. First I understood what the managers needed, then I automated the data pull, and finally I trained two colleagues. I would bring the same approach here because I like turning messy data into decisions."
    ),
    evaluateAnswer(INTERVIEW_MAP["iv-hr-3"], "My weakness is that I sometimes take too long on details. I am working on it."),
  ];
  const summary = summariseInterview(answers, "hr");
  d.interviews.push({
    id: "seed_interview_0",
    at: at(ivDay, 20, 30),
    roleId: "ba",
    type: "hr",
    answers,
    ...summary,
    followUps: ["iv-hr-1", "iv-hr-2", "iv-hr-3"].map((id) => INTERVIEW_MAP[id].followUp),
    durationSec: 14 * 60,
    seeded: true,
  });
  activity.push({
    id: "seed_act_iv", at: at(ivDay, 20, 30), kind: "interview", label: "Mock interview: HR round",
    minutes: 14, href: "/interview/seed_interview_0", seeded: true,
  });
  ev("feedback_viewed", at(ivDay, 20, 31), { kind: "interview" });

  d.saved = ["ba-sql-m7", "ba-di-m4"];
  d.activity = activity.sort((a, b) => a.at.localeCompare(b.at));
  d.events = events.sort((a, b) => a.at.localeCompare(b.at));
  return d;
}
