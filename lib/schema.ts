import { z } from "zod";

// ---------- Setup ----------

export const TOPIC_CATEGORIES = [
  "current-affairs",
  "technology",
  "business",
  "economics",
  "marketing",
  "abstract",
  "social-issues",
  "custom",
] as const;
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "placement", "elite"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PARTICIPANT_COUNTS = [6, 8, 10] as const;
export type ParticipantCount = (typeof PARTICIPANT_COUNTS)[number];

export const DURATIONS = [5, 10, 15, 20] as const;
export type DurationMinutes = (typeof DURATIONS)[number];

export const REALISM_LEVELS = ["low", "medium", "high"] as const;
export type RealismLevel = (typeof REALISM_LEVELS)[number];

export const INTELLIGENCE_LEVELS = ["mixed", "strong", "elite"] as const;
export type IntelligenceLevel = (typeof INTELLIGENCE_LEVELS)[number];

export interface RealismSettings {
  aiAggression: RealismLevel;
  aiIntelligence: IntelligenceLevel;
  interruptionFrequency: RealismLevel;
  chaos: RealismLevel;
  timePressure: RealismLevel;
}

export const DEFAULT_REALISM: RealismSettings = {
  aiAggression: "medium",
  aiIntelligence: "mixed",
  interruptionFrequency: "medium",
  chaos: "medium",
  timePressure: "medium",
};

export interface UserProfile {
  name: string;
  college: string;
  specialization: string;
  targetRoles: string;
  experienceLevel: "fresher" | "0-2 years" | "2-5 years" | "5+ years";
}

export interface GDSettings {
  category: TopicCategory;
  customTopicPrompt?: string;
  difficulty: Difficulty;
  participantCount: ParticipantCount;
  durationMinutes: DurationMinutes;
  coachingMode: boolean;
  realism: RealismSettings;
}

// ---------- Participants ----------

export type PersonaId =
  | "analyst"
  | "aggressive"
  | "knowledgeable"
  | "balanced"
  | "creative"
  | "weak"
  | "hesitant"
  | "moderator"
  | "skeptic";

export interface Persona {
  id: PersonaId;
  archetype: string;
  avatar: string;
  traits: string[];
  speakingStyle: string;
  systemPromptFragment: string;
  baseWeight: number;
  interruptBias: number;
  verbosity: "short" | "medium" | "long";
  qualityTier: "weak" | "average" | "strong" | "elite";
}

export interface Participant {
  id: string;
  personaId?: PersonaId;
  name: string;
  isUser: boolean;
}

// ---------- Transcript ----------

export type TurnReason =
  | "opening"
  | "new-point"
  | "build-on"
  | "rebuttal"
  | "agreement"
  | "clarification"
  | "reframe"
  | "closing"
  | "interruption";

export interface TranscriptEntry {
  id: string;
  turnIndex: number;
  speakerId: string;
  speakerName: string;
  speakerType: "ai" | "user";
  personaId?: PersonaId;
  content: string;
  reason?: TurnReason;
  targetParticipantId?: string;
  confidence?: number;
  isInterruption?: boolean;
  flags?: {
    controversial?: boolean;
    repetition?: boolean;
    uncertainClaim?: boolean;
  };
  timestampMs: number;
  coachingTag?: CoachingTag;
}

// ---------- Structured AI outputs ----------

export const ParticipantActionSchema = z.object({
  action: z.enum(["speak", "pass"]),
  content: z.string(),
  targetParticipant: z.string().optional().nullable(),
  reason: z.enum([
    "opening",
    "new-point",
    "build-on",
    "rebuttal",
    "agreement",
    "clarification",
    "reframe",
    "closing",
    "interruption",
  ]),
  confidence: z.number().min(0).max(1),
  flags: z
    .object({
      controversial: z.boolean().optional(),
      repetition: z.boolean().optional(),
      uncertainClaim: z.boolean().optional(),
    })
    .optional(),
});
export type ParticipantAction = z.infer<typeof ParticipantActionSchema>;

export const TopicGenerationSchema = z.object({
  topic: z.string(),
  context: z.string(),
  suggestedAngles: z.array(z.string()).min(2).max(6),
});
export type TopicGeneration = z.infer<typeof TopicGenerationSchema>;

export const COACHING_TAGS = [
  "strong-entry",
  "strong-point",
  "good-rebuttal",
  "weak-example",
  "repetition",
  "too-long",
  "good-build",
  "unsupported-claim",
] as const;
export type CoachingTag = (typeof COACHING_TAGS)[number];

export const CoachingTagSchema = z.object({
  tag: z.enum(COACHING_TAGS),
  note: z.string(),
});

export const EvaluationScoresSchema = z.object({
  content: z.number().min(0).max(20),
  structure: z.number().min(0).max(15),
  clarity: z.number().min(0).max(15),
  communication: z.number().min(0).max(15),
  businessThinking: z.number().min(0).max(10),
  listeningBuilding: z.number().min(0).max(10),
  leadership: z.number().min(0).max(10),
  participation: z.number().min(0).max(5),
});
export type EvaluationScores = z.infer<typeof EvaluationScoresSchema>;

export const InterventionRewriteSchema = z.object({
  originalQuote: z.string(),
  improvedVersion: z.string(),
  bestPossibleVersion: z.string(),
});
export type InterventionRewrite = z.infer<typeof InterventionRewriteSchema>;

export const CounterargumentSchema = z.object({
  targetStatement: z.string(),
  otherParticipantRebuttal: z.string(),
  strongResponse: z.string(),
});
export type Counterargument = z.infer<typeof CounterargumentSchema>;

export const EvaluationReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  scores: EvaluationScoresSchema,
  strengths: z.array(z.string()).min(3).max(5),
  weaknesses: z.array(z.string()).min(3).max(5),
  whatToAdd: z.array(z.string()).min(2).max(4),
  oneSentenceToRemember: z.string(),
  interventionRewrites: z.array(InterventionRewriteSchema).max(3),
  counterargument: CounterargumentSchema,
});
export type EvaluationReport = z.infer<typeof EvaluationReportSchema>;

export interface CompletedSession {
  id: string;
  dateIso: string;
  topic: string;
  category: TopicCategory;
  difficulty: Difficulty;
  durationMinutes: DurationMinutes;
  report: EvaluationReport;
  transcript: TranscriptEntry[];
  metrics: {
    interventionCount: number;
    avgInterventionLength: number;
    repeatedArguments: number;
    strongInterventions: number;
    successfulRebuttals: number;
  };
}

export const CoachPlanSchema = z.object({
  recurringWeaknesses: z.array(z.string()).min(1).max(4),
  insight: z.string(),
  exerciseType: z.enum(["structure-drill", "rebuttal-drill", "content-drill", "listening-drill"]),
  exercises: z.array(z.string()).min(2).max(10),
});
export type CoachPlan = z.infer<typeof CoachPlanSchema>;
