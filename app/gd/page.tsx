"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGDStore } from "@/lib/store/gdStore";
import { computeSpeakingDurationMs, userOpportunityTimeoutMs } from "@/lib/turnEngineLogic";
import type { SpeechMetrics } from "@/lib/fillerWordAnalysis";
import { TopicHeader } from "@/components/gd/TopicHeader";
import { ParticipantList } from "@/components/gd/ParticipantList";
import { Transcript } from "@/components/gd/Transcript";
import { UserInputBar } from "@/components/gd/UserInputBar";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { SpeechAnalysisPanel } from "@/components/voice/SpeechAnalysisPanel";

export default function GDPage() {
  const router = useRouter();
  const {
    status,
    settings,
    topic,
    topicContext,
    roster,
    transcript,
    elapsedSeconds,
    totalSeconds,
    isProcessingTurn,
    errorMessage,
    requestNextTurn,
    submitUserMessage,
    tick,
    evaluate,
    reset,
  } = useGDStore();

  const [speechMetrics, setSpeechMetrics] = useState<SpeechMetrics | null>(null);
  const scheduledForLength = useRef(-1);
  const awaitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evaluateTriggered = useRef(false);

  useEffect(() => {
    if (status === "idle") router.replace("/setup");
  }, [status, router]);

  // Global 1s ticking timer.
  useEffect(() => {
    if (status !== "live" && status !== "awaiting-user") return;
    const id = setInterval(() => tick(1), 1000);
    return () => clearInterval(id);
  }, [status, tick]);

  // Auto-advance: after an AI line lands, wait a natural "speaking duration" then fetch the next turn.
  useEffect(() => {
    if (status !== "live") return;
    if (transcript.length === 0) return;
    const last = transcript[transcript.length - 1];
    if (last.speakerType !== "ai") return;
    if (scheduledForLength.current === transcript.length) return;
    scheduledForLength.current = transcript.length;

    const delay = computeSpeakingDurationMs(last.content, settings?.realism.timePressure || "medium");
    const timeout = setTimeout(() => {
      requestNextTurn();
    }, delay);
    return () => clearTimeout(timeout);
  }, [transcript, status, settings, requestNextTurn]);

  // If nobody has spoken yet, immediately try to fetch the opener (covers refresh edge cases).
  useEffect(() => {
    if (status === "live" && transcript.length === 0 && !isProcessingTurn) {
      requestNextTurn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // "Your turn" opportunity — auto-continue to an AI if the user stays silent too long.
  useEffect(() => {
    if (status !== "awaiting-user") {
      if (awaitingTimeoutRef.current) clearTimeout(awaitingTimeoutRef.current);
      return;
    }
    const delay = userOpportunityTimeoutMs(settings?.realism.timePressure || "medium");
    awaitingTimeoutRef.current = setTimeout(() => {
      requestNextTurn({ excludeUserOpportunity: true });
    }, delay);
    return () => {
      if (awaitingTimeoutRef.current) clearTimeout(awaitingTimeoutRef.current);
    };
  }, [status, settings, requestNextTurn]);

  // GD ended -> run evaluation once, then move to the report.
  useEffect(() => {
    if (status === "ended" && !evaluateTriggered.current) {
      evaluateTriggered.current = true;
      evaluate();
    }
    if (status === "evaluated") {
      router.push("/report");
    }
  }, [status, evaluate, router]);

  if (!settings || status === "idle") return null;

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-1px)]">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
          <p className="text-sm text-muted">Setting up the room and generating your topic…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-1px)] px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-medium text-danger mb-2">Something went wrong</p>
          <p className="text-sm text-muted">{errorMessage}</p>
          <button
            onClick={() => {
              reset();
              router.push("/setup");
            }}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  const currentSpeakerId = isProcessingTurn ? null : null;

  return (
    <div className="flex flex-col h-[calc(100vh-1px)]">
      <TopicHeader
        topic={topic}
        category={settings.category}
        difficulty={settings.difficulty}
        elapsedSeconds={elapsedSeconds}
        totalSeconds={totalSeconds}
      />
      <div className="flex flex-1 min-h-0">
        <ParticipantList roster={roster} currentSpeakerId={currentSpeakerId} isThinking={isProcessingTurn} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Transcript
            transcript={transcript}
            roster={roster}
            coachingMode={settings.coachingMode}
            isProcessingTurn={isProcessingTurn}
            currentSpeakerName={null}
          />
          {speechMetrics && (
            <div className="px-5 pt-3">
              <SpeechAnalysisPanel metrics={speechMetrics} onDismiss={() => setSpeechMetrics(null)} />
            </div>
          )}
          <UserInputBar
            onSubmit={(content) => {
              submitUserMessage(content);
            }}
            disabled={status === "evaluating" || status === "ended"}
            isYourTurnCue={status === "awaiting-user"}
            extraControls={
              <VoiceInputButton
                onTranscript={(text) => submitUserMessage(text)}
                onAnalysis={(metrics) => setSpeechMetrics(metrics)}
              />
            }
          />
        </div>
      </div>
      <div className="border-t border-border bg-surface-muted px-5 py-1.5 flex items-center justify-between text-[11px] text-muted">
        <span>
          {topicContext}
        </span>
        <button
          onClick={() => useGDStore.setState({ status: "ended" })}
          className="shrink-0 ml-4 underline hover:text-foreground"
        >
          End GD now
        </button>
      </div>
    </div>
  );
}
