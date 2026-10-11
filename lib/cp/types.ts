// Domain model for CampusPrep. These shapes mirror the tables in supabase/schema.sql
// so the local demo repository can be swapped for a Supabase one without touching the UI.

export type RoleId = "ba" | "pm" | "marketing" | "finance" | "consulting" | "software";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type TaskStatus = "not_started" | "in_progress" | "completed";
export type QuestionType = "mcq" | "sql" | "short" | "case" | "interview";
export type InterviewType = "hr" | "behavioural" | "technical" | "case" | "role";
export type ThemePref = "light" | "dark" | "system";
export type TimelineWeeks = 2 | 4 | 8 | 12;

export interface Profile {
  id: string;
  name: string;
  email: string;
  institution: string;
  degree: string;
  gradYear: number | null;
  targetRoles: RoleId[];
  primaryRole: RoleId | null;
  timelineWeeks: TimelineWeeks;
  minutesPerDay: number;
  onboarded: boolean;
  theme: ThemePref;
  isDemo: boolean;
  /** Consent to be counted in anonymised cohort aggregates. Off by default. */
  shareAggregates: boolean;
  createdAt: string;
}

export interface PracticeRef {
  topics: string[];
  count: number;
  types?: QuestionType[];
  timed?: boolean;
}

export interface RoadmapTask {
  id: string;
  key: string;
  week: number;
  dueDate: string; // YYYY-MM-DD
  phase: string;
  title: string;
  description: string;
  topic: string;
  difficulty: Difficulty;
  durationMin: number;
  objective: string;
  /** Embedded lesson: key points shown inside the task. */
  notes: string[];
  moduleId?: string;
  practice?: PracticeRef;
  interviewType?: InterviewType;
  status: TaskStatus;
  score?: number;
  startedAt?: string;
  completedAt?: string;
  seeded?: boolean;
}

export interface Roadmap {
  id: string;
  roleId: RoleId;
  weeks: TimelineWeeks;
  minutesPerDay: number;
  startDate: string;
  generatedAt: string;
  tasks: RoadmapTask[];
  /** Optional tasks left out because they did not fit the time budget. */
  droppedCount: number;
}

export interface LearningModule {
  id: string;
  roles: RoleId[];
  topic: string;
  title: string;
  description: string;
  durationMin: number;
  difficulty: Difficulty;
  objectives: string[];
  sections: { heading: string; body: string }[];
  exercise: { prompt: string; solution: string };
  external?: { label: string; url: string }[];
}

export interface ModuleProgress {
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  quizScore?: number;
  seeded?: boolean;
}

export interface KeyPoint {
  label: string;
  /** The point counts as covered if any of these terms appears in the answer. */
  any: string[];
}

export interface Question {
  id: string;
  roles: RoleId[];
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  explanation: string;
  moduleId?: string;
  // mcq
  options?: string[];
  answer?: number;
  // sql
  solution?: string;
  orderMatters?: boolean;
  // written (short / case / interview)
  modelAnswer?: string;
  keyPoints?: KeyPoint[];
}

export interface QuestionResponse {
  questionId: string;
  topic: string;
  type: QuestionType;
  answer: string | number | null;
  correct: boolean;
  /** 0..1 — partial credit for written answers. */
  score: number;
  detail?: string;
  matched?: string[];
}

export interface SessionSource {
  type: "bank" | "module" | "task" | "baseline" | "saved";
  id?: string;
}

export interface PracticeAttempt {
  id: string;
  at: string;
  title: string;
  source: SessionSource;
  roleId: RoleId | null;
  durationSec: number;
  timeLimitSec?: number;
  responses: QuestionResponse[];
  scorePct: number;
  seeded?: boolean;
}

export interface ActiveSession {
  id: string;
  title: string;
  questionIds: string[];
  answers: Record<string, string | number>;
  index: number;
  startedAt: string;
  timeLimitSec?: number;
  source: SessionSource;
  taskId?: string;
}

export interface InterviewQuestion {
  id: string;
  role: RoleId | "all";
  type: InterviewType;
  prompt: string;
  keywords: string[];
  followUp: string;
  tip: string;
}

export interface RubricScore {
  key: "relevance" | "structure" | "evidence" | "depth" | "communication";
  label: string;
  score: number; // 1..5
  signals: string[];
}

export interface AnswerEval {
  questionId: string;
  prompt: string;
  answer: string;
  rubric: RubricScore[];
  score: number; // 0..100
}

export interface AiFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  followUps: string[];
  provider: string;
}

export interface MockInterview {
  id: string;
  at: string;
  roleId: RoleId;
  type: InterviewType;
  answers: AnswerEval[];
  overall: number;
  rubric: { key: RubricScore["key"]; label: string; score: number }[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  followUps: string[];
  durationSec: number;
  taskId?: string;
  ai?: AiFeedback;
  seeded?: boolean;
}

export interface ActiveInterview {
  id: string;
  roleId: RoleId;
  type: InterviewType;
  questionIds: string[];
  answers: Record<string, string>;
  index: number;
  startedAt: string;
  taskId?: string;
}

export interface Activity {
  id: string;
  at: string;
  kind: "task" | "module" | "practice" | "interview" | "roadmap" | "account";
  label: string;
  minutes: number;
  href?: string;
  seeded?: boolean;
}

export type EventName =
  | "signup_completed"
  | "onboarding_completed"
  | "role_selected"
  | "roadmap_generated"
  | "roadmap_viewed"
  | "task_started"
  | "task_completed"
  | "practice_started"
  | "practice_submitted"
  | "feedback_viewed"
  | "recommended_task_completed"
  | "session_returned"
  | "content_issue_reported"
  | "recommendation_followed";

export interface AnalyticsEvent {
  id: string;
  at: string;
  name: EventName;
  props?: Record<string, string | number | boolean>;
  seeded?: boolean;
}

export interface FeedbackReport {
  id: string;
  at: string;
  kind: "content" | "support";
  subject: string;
  message: string;
  ref?: string;
}

export interface FollowedRec {
  ruleId: string;
  refType: "module" | "practice" | "interview" | "task";
  refId: string;
  at: string;
}

export interface UserData {
  version: 1;
  profile: Profile;
  roadmap: Roadmap | null;
  modules: Record<string, ModuleProgress>;
  attempts: PracticeAttempt[];
  interviews: MockInterview[];
  saved: string[];
  activity: Activity[];
  events: AnalyticsEvent[];
  reports: FeedbackReport[];
  activeSession: ActiveSession | null;
  activeInterview: ActiveInterview | null;
  followedRec: FollowedRec | null;
  lastSeenAt: string | null;
}
