import { create } from "zustand";
import type { CompletedSession, CoachingTag, EvaluationReport, GDSettings, Participant, TranscriptEntry } from "@/lib/schema";
import { saveSession, getProfile } from "@/lib/storage/sessionHistory";

export type GDStatus = "idle" | "loading" | "live" | "awaiting-user" | "ended" | "evaluating" | "evaluated" | "error";

interface GDStore {
  settings: GDSettings | null;
  userName: string;
  topic: string;
  topicContext: string;
  roster: Participant[];
  transcript: TranscriptEntry[];
  status: GDStatus;
  errorMessage: string | null;
  elapsedSeconds: number;
  totalSeconds: number;
  userLastSpokeAtSeconds: number | null;
  isProcessingTurn: boolean;
  turnCounter: number;
  report: EvaluationReport | null;
  lastCompletedSessionId: string | null;

  startSession: (settings: GDSettings, userName: string) => Promise<void>;
  requestNextTurn: (opts?: { excludeUserOpportunity?: boolean }) => Promise<void>;
  submitUserMessage: (content: string) => Promise<void>;
  applyCoachingTag: (entryId: string, tag: CoachingTag) => void;
  tick: (deltaSeconds: number) => void;
  endSession: () => void;
  evaluate: () => Promise<void>;
  reset: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useGDStore = create<GDStore>((set, get) => ({
  settings: null,
  userName: "You",
  topic: "",
  topicContext: "",
  roster: [],
  transcript: [],
  status: "idle",
  errorMessage: null,
  elapsedSeconds: 0,
  totalSeconds: 0,
  userLastSpokeAtSeconds: null,
  isProcessingTurn: false,
  turnCounter: 0,
  report: null,
  lastCompletedSessionId: null,

  startSession: async (settings, userName) => {
    set({
      status: "loading",
      settings,
      userName,
      transcript: [],
      elapsedSeconds: 0,
      totalSeconds: settings.durationMinutes * 60,
      userLastSpokeAtSeconds: null,
      turnCounter: 0,
      errorMessage: null,
      report: null,
      lastCompletedSessionId: null,
    });
    try {
      const res = await fetch("/api/gd/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, userName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start the GD.");
      }
      const data = await res.json();
      set({
        topic: data.topic,
        topicContext: data.context,
        roster: data.participants,
        status: "live",
      });
      await get().requestNextTurn();
    } catch (err) {
      set({ status: "error", errorMessage: err instanceof Error ? err.message : "Something went wrong." });
    }
  },

  requestNextTurn: async (opts) => {
    const state = get();
    if (state.status === "ended" || state.isProcessingTurn) return;
    if (state.elapsedSeconds >= state.totalSeconds) {
      get().endSession();
      return;
    }
    set({ isProcessingTurn: true });
    try {
      const res = await fetch("/api/gd/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          topicContext: state.topicContext,
          roster: state.roster,
          transcript: state.transcript,
          settings: state.settings,
          elapsedSeconds: state.elapsedSeconds,
          totalSeconds: state.totalSeconds,
          userLastSpokeAtSeconds: state.userLastSpokeAtSeconds,
          excludeUserOpportunity: opts?.excludeUserOpportunity,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to get next turn.");
      }
      const data = await res.json();
      if (data.type === "user-opportunity") {
        set({ status: "awaiting-user", isProcessingTurn: false });
        return;
      }
      const entry: TranscriptEntry = {
        id: makeId(),
        turnIndex: get().turnCounter,
        speakerId: data.entry.speakerId,
        speakerName: data.entry.speakerName,
        speakerType: "ai",
        personaId: data.entry.personaId,
        content: data.entry.content,
        reason: data.entry.reason,
        targetParticipantId: data.entry.targetParticipantId,
        confidence: data.entry.confidence,
        isInterruption: data.entry.isInterruption,
        flags: data.entry.flags,
        timestampMs: Date.now(),
      };
      set((s) => ({
        transcript: [...s.transcript, entry],
        turnCounter: s.turnCounter + 1,
        status: "live",
        isProcessingTurn: false,
      }));
    } catch (err) {
      set({ status: "error", errorMessage: err instanceof Error ? err.message : "Something went wrong.", isProcessingTurn: false });
    }
  },

  submitUserMessage: async (content: string) => {
    const state = get();
    const trimmed = content.trim();
    if (!trimmed) return;
    const entry: TranscriptEntry = {
      id: makeId(),
      turnIndex: state.turnCounter,
      speakerId: "user",
      speakerName: state.userName,
      speakerType: "user",
      content: trimmed,
      timestampMs: Date.now(),
    };
    set((s) => ({
      transcript: [...s.transcript, entry],
      turnCounter: s.turnCounter + 1,
      userLastSpokeAtSeconds: s.elapsedSeconds,
      status: "live",
    }));

    if (state.settings?.coachingMode) {
      fetch("/api/coach/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentTranscript: state.transcript.slice(-8).map((t) => `${t.speakerName}: ${t.content}`).join("\n"),
          latestUserLine: trimmed,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.tag) get().applyCoachingTag(entry.id, data.tag);
        })
        .catch(() => {});
    }

    await get().requestNextTurn();
  },

  applyCoachingTag: (entryId, tag) => {
    set((s) => ({
      transcript: s.transcript.map((t) => (t.id === entryId ? { ...t, coachingTag: tag } : t)),
    }));
  },

  tick: (deltaSeconds: number) => {
    const state = get();
    if (state.status === "ended" || state.status === "idle" || state.status === "loading") return;
    const nextElapsed = state.elapsedSeconds + deltaSeconds;
    if (nextElapsed >= state.totalSeconds) {
      set({ elapsedSeconds: state.totalSeconds });
      get().endSession();
      return;
    }
    set({ elapsedSeconds: nextElapsed });
  },

  endSession: () => set({ status: "ended" }),

  evaluate: async () => {
    const state = get();
    if (state.status === "evaluating" || state.report) return;
    set({ status: "evaluating" });
    try {
      const res = await fetch("/api/gd/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          transcript: state.transcript,
          userDisplayName: state.userName,
          userProfile: getProfile() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to evaluate the GD.");
      }
      const report: EvaluationReport = await res.json();

      const userLines = state.transcript.filter((t) => t.speakerType === "user");
      const avgLen = userLines.length
        ? Math.round(userLines.reduce((s, l) => s + l.content.split(/\s+/).length, 0) / userLines.length)
        : 0;

      const session: CompletedSession = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        dateIso: new Date().toISOString(),
        topic: state.topic,
        category: state.settings!.category,
        difficulty: state.settings!.difficulty,
        durationMinutes: state.settings!.durationMinutes,
        report,
        transcript: state.transcript,
        metrics: {
          interventionCount: userLines.length,
          avgInterventionLength: avgLen,
          repeatedArguments: report.weaknesses.filter((w) => /repeat/i.test(w)).length,
          strongInterventions: report.strengths.length,
          successfulRebuttals: userLines.filter((l) => l.reason === "rebuttal").length,
        },
      };
      saveSession(session);

      set({ report, status: "evaluated", lastCompletedSessionId: session.id });
    } catch (err) {
      set({ status: "error", errorMessage: err instanceof Error ? err.message : "Failed to evaluate." });
    }
  },

  reset: () =>
    set({
      settings: null,
      topic: "",
      topicContext: "",
      roster: [],
      transcript: [],
      status: "idle",
      errorMessage: null,
      elapsedSeconds: 0,
      totalSeconds: 0,
      userLastSpokeAtSeconds: null,
      isProcessingTurn: false,
      turnCounter: 0,
      report: null,
      lastCompletedSessionId: null,
    }),
}));
