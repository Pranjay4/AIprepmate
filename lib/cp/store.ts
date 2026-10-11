"use client";

import { create } from "zustand";
import type {
  ActiveSession, AiFeedback, AnalyticsEvent, EventName, InterviewType, MockInterview, PracticeAttempt,
  Profile, Question, QuestionResponse, QuestionType, RoleId, SessionSource, TaskStatus, ThemePref, TimelineWeeks, UserData,
} from "./types";
import { getRepository } from "./data";
import { RepoError } from "./data/repository";
import { buildDemoUser, DEMO_ID, emptyUser, newProfile } from "./seed";
import { generateRoadmap, rescheduleOverdue } from "./roadmap";
import { QUESTIONS, QUESTION_MAP } from "./content/questions";
import { MODULE_MAP } from "./content/modules";
import { INTERVIEW_MAP, interviewPool } from "./content/interviews";
import { topicsForRole } from "./content/roles";
import { evaluateAnswer, summariseInterview } from "./rubric";
import { scorePct } from "./grading";
import { strengthsAndWeaknesses, type Recommendation } from "./insights";
import { dayKey, shuffle, uid } from "./util";

const THEME_KEY = "campusprep.theme";

export function applyTheme(pref: ThemePref) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, pref);
  } catch {}
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

interface CPState {
  ready: boolean;
  data: UserData | null;
  saveError: string | null;
  init: () => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  enterDemo: () => Promise<void>;
  logOut: () => Promise<void>;
  mutate: (fn: (d: UserData) => void) => void;
}

function persist(data: UserData) {
  getRepository()
    .saveUser(data.profile.id, data)
    .then(() => useCP.setState({ saveError: null }))
    .catch((e) => useCP.setState({ saveError: e instanceof Error ? e.message : "Could not save your progress." }));
}

function pushEvent(d: UserData, name: EventName, props?: AnalyticsEvent["props"]) {
  d.events.push({ id: uid("ev"), at: new Date().toISOString(), name, props });
  if (d.events.length > 3000) d.events = d.events.slice(-3000);
}

function logActivity(d: UserData, kind: UserData["activity"][number]["kind"], label: string, minutes: number, href?: string) {
  d.activity.push({ id: uid("act"), at: new Date().toISOString(), kind, label, minutes: Math.max(0, Math.round(minutes)), href });
  if (d.activity.length > 1500) d.activity = d.activity.slice(-1500);
}

/** Marks a return visit when the previous activity was on an earlier day or 30+ minutes ago. */
function touchSession(d: UserData) {
  const now = new Date();
  if (d.lastSeenAt) {
    const gapMin = (now.getTime() - new Date(d.lastSeenAt).getTime()) / 60000;
    if (gapMin >= 30) pushEvent(d, "session_returned", { gapHours: Math.round(gapMin / 6) / 10 });
  }
  d.lastSeenAt = now.toISOString();
}

export const useCP = create<CPState>((set, get) => ({
  ready: false,
  data: null,
  saveError: null,

  async init() {
    if (get().ready) return;
    const repo = getRepository();
    try {
      const id = await repo.getSessionUserId();
      const data = id ? await repo.loadUser(id) : null;
      if (data) {
        touchSession(data);
        persist(data);
        applyTheme(data.profile.theme);
      }
      set({ data, ready: true });
    } catch {
      set({ data: null, ready: true });
    }
  },

  async signUp(input) {
    const repo = getRepository();
    const user = await repo.signUp(input);
    const data = emptyUser(newProfile(user.id, user.name, user.email));
    pushEvent(data, "signup_completed");
    data.lastSeenAt = new Date().toISOString();
    await repo.saveUser(user.id, data);
    await repo.setSessionUserId(user.id);
    set({ data });
  },

  async logIn(email, password) {
    const repo = getRepository();
    const user = await repo.signIn(email, password);
    const data = (await repo.loadUser(user.id)) ?? emptyUser(newProfile(user.id, user.name, user.email));
    touchSession(data);
    await repo.saveUser(user.id, data);
    await repo.setSessionUserId(user.id);
    applyTheme(data.profile.theme);
    set({ data });
  },

  async enterDemo() {
    const repo = getRepository();
    let data = await repo.loadUser(DEMO_ID);
    if (!data) data = buildDemoUser();
    touchSession(data);
    await repo.saveUser(DEMO_ID, data);
    await repo.setSessionUserId(DEMO_ID);
    applyTheme(data.profile.theme);
    set({ data });
  },

  async logOut() {
    await getRepository().setSessionUserId(null);
    set({ data: null });
  },

  mutate(fn) {
    const cur = get().data;
    if (!cur) return;
    const next = structuredClone(cur);
    fn(next);
    set({ data: next });
    persist(next);
  },
}));

export { RepoError };

const mutate = (fn: (d: UserData) => void) => useCP.getState().mutate(fn);

// ───────────── Analytics ─────────────

export function track(name: EventName, props?: AnalyticsEvent["props"]) {
  mutate((d) => pushEvent(d, name, props));
}

/** Records an event at most once per calendar day (used for page-view style events). */
export function trackDaily(name: EventName) {
  const d = useCP.getState().data;
  if (!d) return;
  const today = dayKey();
  if (!d.events.some((e) => e.name === name && dayKey(e.at) === today)) track(name);
}

// ───────────── Recommendations ─────────────

export function followRecommendation(rec: Recommendation) {
  mutate((d) => {
    d.followedRec = { ruleId: rec.ruleId, refType: rec.refType, refId: rec.refId, at: new Date().toISOString() };
    pushEvent(d, "recommendation_followed", { rule: rec.ruleId.split(":")[0] });
  });
}

function settleRecommendation(d: UserData, refType: Recommendation["refType"], refIds: (string | undefined)[]) {
  const f = d.followedRec;
  if (!f || f.refType !== refType) return;
  if (f.refId === "any" || refIds.includes(f.refId)) {
    pushEvent(d, "recommended_task_completed", { rule: f.ruleId.split(":")[0] });
    d.followedRec = null;
  }
}

// ───────────── Profile & plan ─────────────

export function updateProfile(patch: Partial<Profile>) {
  mutate((d) => {
    d.profile = { ...d.profile, ...patch };
  });
  if (patch.theme) applyTheme(patch.theme);
}

export interface PlanInput {
  targetRoles: RoleId[];
  primaryRole: RoleId;
  timelineWeeks: TimelineWeeks;
  minutesPerDay: number;
}

/** Lessons finished earlier count as done when they appear in a newly built roadmap. */
function creditCompletedModules(d: UserData) {
  for (const t of d.roadmap?.tasks ?? []) {
    const m = t.moduleId ? d.modules[t.moduleId] : undefined;
    if (m?.status === "completed" && t.status !== "completed") {
      t.status = "completed";
      t.score = m.quizScore;
      t.startedAt = m.startedAt;
      t.completedAt = m.completedAt;
      t.seeded = m.seeded;
    }
  }
}

export function completeOnboarding(plan: PlanInput, profile: Partial<Profile>) {
  mutate((d) => {
    d.profile = { ...d.profile, ...profile, ...plan, onboarded: true };
    d.roadmap = generateRoadmap(plan.primaryRole, plan.timelineWeeks, plan.minutesPerDay);
    creditCompletedModules(d);
    pushEvent(d, "role_selected", { role: plan.primaryRole, roles: plan.targetRoles.length });
    pushEvent(d, "onboarding_completed");
    pushEvent(d, "roadmap_generated", { role: plan.primaryRole, weeks: plan.timelineWeeks, minutes: plan.minutesPerDay });
    logActivity(d, "account", "Generated preparation roadmap", 0, "/roadmap");
  });
}

/** Regenerates the roadmap for new settings. Progress carries over when the role is unchanged. */
export function updatePlan(plan: PlanInput) {
  mutate((d) => {
    const sameRole = d.roadmap?.roleId === plan.primaryRole;
    if (!sameRole) pushEvent(d, "role_selected", { role: plan.primaryRole, roles: plan.targetRoles.length });
    d.profile = { ...d.profile, ...plan, onboarded: true };
    d.roadmap = generateRoadmap(
      plan.primaryRole, plan.timelineWeeks, plan.minutesPerDay,
      sameRole && d.roadmap ? d.roadmap.startDate : dayKey(),
      sameRole ? d.roadmap : null
    );
    creditCompletedModules(d);
    pushEvent(d, "roadmap_generated", { role: plan.primaryRole, weeks: plan.timelineWeeks, minutes: plan.minutesPerDay, adjusted: true });
    logActivity(d, "account", "Adjusted preparation roadmap", 0, "/roadmap");
  });
}

export function rescheduleOverdueTasks() {
  mutate((d) => {
    if (d.roadmap) d.roadmap = rescheduleOverdue(d.roadmap);
    settleRecommendation(d, "task", ["reschedule"]);
  });
}

// ───────────── Roadmap tasks ─────────────

function completeTask(d: UserData, taskId: string, score?: number, logMinutes?: number) {
  const t = d.roadmap?.tasks.find((x) => x.id === taskId);
  if (!t || t.status === "completed") return;
  const now = new Date().toISOString();
  t.status = "completed";
  t.startedAt ??= now;
  t.completedAt = now;
  if (score !== undefined) t.score = score;
  pushEvent(d, "task_completed", { task: t.key, week: t.week });
  if (logMinutes !== undefined) logActivity(d, "task", `Completed: ${t.title}`, logMinutes, `/roadmap?task=${t.id}`);
  settleRecommendation(d, "task", [t.id]);
}

export function setTaskStatus(taskId: string, status: TaskStatus) {
  mutate((d) => {
    const t = d.roadmap?.tasks.find((x) => x.id === taskId);
    if (!t || t.status === status) return;
    if (status === "completed") {
      // Marked complete by hand: credit the estimated duration.
      completeTask(d, taskId, undefined, t.durationMin);
    } else if (status === "in_progress") {
      t.status = "in_progress";
      t.startedAt ??= new Date().toISOString();
      t.completedAt = undefined;
      pushEvent(d, "task_started", { task: t.key, week: t.week });
    } else {
      t.status = "not_started";
      t.startedAt = undefined;
      t.completedAt = undefined;
      t.score = undefined;
    }
  });
}

function startTaskIfNeeded(d: UserData, taskId?: string) {
  const t = taskId ? d.roadmap?.tasks.find((x) => x.id === taskId) : undefined;
  if (t && t.status === "not_started") {
    t.status = "in_progress";
    t.startedAt = new Date().toISOString();
    pushEvent(d, "task_started", { task: t.key, week: t.week });
  }
}

// ───────────── Learning modules ─────────────

export function startModule(moduleId: string) {
  const d = useCP.getState().data;
  if (!d || d.modules[moduleId]) return;
  mutate((x) => {
    x.modules[moduleId] = { status: "in_progress", startedAt: new Date().toISOString() };
    for (const t of x.roadmap?.tasks ?? []) if (t.moduleId === moduleId) startTaskIfNeeded(x, t.id);
  });
}

export function submitModuleQuiz(moduleId: string, responses: QuestionResponse[], durationSec: number) {
  const m = MODULE_MAP[moduleId];
  mutate((d) => {
    const score = scorePct(responses);
    const now = new Date().toISOString();
    const first = d.modules[moduleId]?.status !== "completed";
    d.attempts.push({
      id: uid("attempt"), at: now, title: `Lesson quiz: ${m.title}`, source: { type: "module", id: moduleId },
      roleId: d.profile.primaryRole, durationSec, responses, scorePct: score,
    });
    d.modules[moduleId] = {
      ...d.modules[moduleId], status: "completed", completedAt: now, quizScore: score, seeded: undefined,
      startedAt: d.modules[moduleId]?.startedAt ?? now,
    };
    pushEvent(d, "practice_started", { source: "module" });
    pushEvent(d, "practice_submitted", { source: "module", score });
    // First completion credits the lesson's estimated duration; retakes credit quiz time only.
    logActivity(d, "module", `${first ? "Completed lesson" : "Retook quiz"}: ${m.title}`, first ? m.durationMin : durationSec / 60, `/learn/${moduleId}`);
    for (const t of d.roadmap?.tasks ?? []) if (t.moduleId === moduleId) completeTask(d, t.id, score);
    settleRecommendation(d, "module", [moduleId]);
  });
}

// ───────────── Practice ─────────────

export interface PracticeConfig {
  title: string;
  role: RoleId | null;
  /** [] = weakest topics for the role; ["*"] = every topic for the role. */
  topics: string[];
  types?: QuestionType[];
  difficulty?: string;
  count: number;
  timed?: boolean;
  source: SessionSource;
  taskId?: string;
  questionIds?: string[];
}

export function resolveTopics(d: UserData, role: RoleId | null, topics: string[]): string[] {
  const all = role ? topicsForRole(role) : [...new Set(QUESTIONS.map((q) => q.topic))];
  if (topics.includes("*")) return all;
  if (topics.length) return topics;
  const weak = strengthsAndWeaknesses(d).weak.map((w) => w.topic);
  return weak.length ? weak : all;
}

export function pickQuestions(d: UserData, c: PracticeConfig): Question[] {
  if (c.questionIds) return c.questionIds.map((id) => QUESTION_MAP[id]).filter(Boolean);
  const topics = resolveTopics(d, c.role, c.topics);
  const pool = QUESTIONS.filter(
    (q) =>
      topics.includes(q.topic) &&
      (!c.role || q.roles.includes(c.role)) &&
      (!c.types?.length || c.types.includes(q.type)) &&
      (!c.difficulty || c.difficulty === "All" || q.difficulty === c.difficulty)
  );
  return shuffle(pool).slice(0, c.count);
}

const SECONDS: Record<QuestionType, number> = { mcq: 75, sql: 240, short: 240, case: 420, interview: 300 };

/** Starts a session. Returns false when no questions match the filters. */
export function startPractice(c: PracticeConfig): boolean {
  const d = useCP.getState().data;
  if (!d) return false;
  const qs = pickQuestions(d, c);
  if (!qs.length) return false;
  const session: ActiveSession = {
    id: uid("session"),
    title: c.title,
    questionIds: qs.map((q) => q.id),
    answers: {},
    index: 0,
    startedAt: new Date().toISOString(),
    timeLimitSec: c.timed ? qs.reduce((s, q) => s + SECONDS[q.type], 0) : undefined,
    source: c.source,
    taskId: c.taskId,
  };
  mutate((x) => {
    x.activeSession = session;
    startTaskIfNeeded(x, c.taskId);
    pushEvent(x, "practice_started", { source: c.source.type, questions: qs.length, timed: !!c.timed });
  });
  return true;
}

export function answerQuestion(questionId: string, value: string | number) {
  mutate((d) => {
    if (d.activeSession) d.activeSession.answers[questionId] = value;
  });
}

export function setSessionIndex(index: number) {
  mutate((d) => {
    if (d.activeSession) d.activeSession.index = index;
  });
}

export function discardPractice() {
  mutate((d) => {
    d.activeSession = null;
  });
}

export function submitPractice(responses: QuestionResponse[]): string {
  const id = uid("attempt");
  mutate((d) => {
    const s = d.activeSession;
    if (!s) return;
    const now = new Date();
    const elapsed = Math.round((now.getTime() - new Date(s.startedAt).getTime()) / 1000);
    const durationSec = s.timeLimitSec ? Math.min(elapsed, s.timeLimitSec) : Math.min(elapsed, responses.length * 600);
    const score = scorePct(responses);
    const attempt: PracticeAttempt = {
      id, at: now.toISOString(), title: s.title, source: s.source, roleId: d.profile.primaryRole,
      durationSec, timeLimitSec: s.timeLimitSec, responses, scorePct: score,
    };
    d.attempts.push(attempt);
    d.activeSession = null;
    pushEvent(d, "practice_submitted", { source: s.source.type, score, questions: responses.length });
    logActivity(d, "practice", `Practice: ${s.title} — ${score}%`, durationSec / 60, `/practice/results/${id}`);
    if (s.taskId) completeTask(d, s.taskId, score);
    settleRecommendation(d, "practice", [...new Set(responses.map((r) => r.topic))]);
  });
  return id;
}

export function toggleSaved(questionId: string) {
  mutate((d) => {
    d.saved = d.saved.includes(questionId) ? d.saved.filter((x) => x !== questionId) : [...d.saved, questionId];
  });
}

// ───────────── Mock interviews ─────────────

export function startInterview(roleId: RoleId, type: InterviewType, count: number, taskId?: string): boolean {
  const pool = interviewPool(roleId, type);
  if (!pool.length) return false;
  const picked = shuffle(pool).slice(0, count);
  mutate((d) => {
    d.activeInterview = {
      id: uid("interview"), roleId, type, questionIds: picked.map((q) => q.id), answers: {}, index: 0,
      startedAt: new Date().toISOString(), taskId,
    };
    startTaskIfNeeded(d, taskId);
    pushEvent(d, "practice_started", { source: "interview", type });
  });
  return true;
}

export function saveInterviewAnswer(questionId: string, text: string, index?: number) {
  mutate((d) => {
    if (!d.activeInterview) return;
    d.activeInterview.answers[questionId] = text;
    if (index !== undefined) d.activeInterview.index = index;
  });
}

export function discardInterview() {
  mutate((d) => {
    d.activeInterview = null;
  });
}

export function submitInterview(): string | null {
  const cur = useCP.getState().data?.activeInterview;
  if (!cur) return null;
  mutate((d) => {
    const a = d.activeInterview;
    if (!a) return;
    const answers = a.questionIds.map((qid) => evaluateAnswer(INTERVIEW_MAP[qid], a.answers[qid] ?? ""));
    const summary = summariseInterview(answers, a.type);
    const now = new Date();
    const durationSec = Math.min(Math.round((now.getTime() - new Date(a.startedAt).getTime()) / 1000), a.questionIds.length * 900);
    const interview: MockInterview = {
      id: a.id, at: now.toISOString(), roleId: a.roleId, type: a.type, answers, ...summary,
      followUps: a.questionIds.map((qid) => INTERVIEW_MAP[qid].followUp),
      durationSec, taskId: a.taskId,
    };
    d.interviews.push(interview);
    d.activeInterview = null;
    pushEvent(d, "practice_submitted", { source: "interview", type: a.type, score: summary.overall });
    logActivity(d, "interview", `Mock interview: ${a.type === "hr" ? "HR" : a.type} round — ${summary.overall}/100`, durationSec / 60, `/interview/${a.id}`);
    if (a.taskId) completeTask(d, a.taskId, summary.overall);
    settleRecommendation(d, "interview", [a.type]);
  });
  return cur.id;
}

export function attachAiFeedback(interviewId: string, ai: AiFeedback) {
  mutate((d) => {
    const i = d.interviews.find((x) => x.id === interviewId);
    if (i) i.ai = ai;
  });
}

// ───────────── Feedback & account ─────────────

export function submitReport(kind: "content" | "support", subject: string, message: string, ref?: string) {
  mutate((d) => {
    d.reports.push({ id: uid("report"), at: new Date().toISOString(), kind, subject, message, ref });
    if (kind === "content") pushEvent(d, "content_issue_reported", { ref: ref ?? "general" });
  });
}

/** Removes sample records from the demo account, keeping anything the user did themselves. */
export function removeSampleData() {
  mutate((d) => {
    d.attempts = d.attempts.filter((a) => !a.seeded);
    d.interviews = d.interviews.filter((a) => !a.seeded);
    d.activity = d.activity.filter((a) => !a.seeded);
    d.events = d.events.filter((a) => !a.seeded);
    for (const [id, m] of Object.entries(d.modules)) if (m.seeded) delete d.modules[id];
    for (const t of d.roadmap?.tasks ?? []) {
      if (t.seeded) {
        t.status = "not_started";
        t.score = undefined;
        t.startedAt = undefined;
        t.completedAt = undefined;
        t.seeded = undefined;
      }
    }
  });
}

export async function resetDemo() {
  const repo = getRepository();
  const data = buildDemoUser();
  data.lastSeenAt = new Date().toISOString();
  await repo.saveUser(DEMO_ID, data);
  applyTheme(data.profile.theme);
  useCP.setState({ data });
}

export async function deleteAccount() {
  const d = useCP.getState().data;
  if (!d) return;
  const repo = getRepository();
  await repo.deleteUser(d.profile.id);
  await repo.setSessionUserId(null);
  useCP.setState({ data: null });
}

export function hasSampleData(d: UserData): boolean {
  return d.attempts.some((a) => a.seeded) || d.interviews.some((a) => a.seeded) || d.activity.some((a) => a.seeded);
}

/** Optional onboarding assessment: stored as a normal attempt so it feeds topic performance. */
export function recordBaseline(responses: QuestionResponse[], durationSec: number) {
  if (!responses.length) return;
  mutate((d) => {
    const score = scorePct(responses);
    d.attempts.push({
      id: uid("attempt"), at: new Date().toISOString(), title: "Baseline skills check", source: { type: "baseline" },
      roleId: d.profile.primaryRole, durationSec, responses, scorePct: score,
    });
    pushEvent(d, "practice_started", { source: "baseline" });
    pushEvent(d, "practice_submitted", { source: "baseline", score });
    logActivity(d, "practice", `Baseline skills check — ${score}%`, durationSec / 60);
  });
}

export function useData(): UserData {
  return useCP((s) => s.data) as UserData;
}
