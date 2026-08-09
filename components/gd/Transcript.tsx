"use client";

import { useEffect, useRef } from "react";
import type { Participant, TranscriptEntry } from "@/lib/schema";
import { PERSONAS } from "@/lib/personas";
import { CoachingBadge } from "./CoachingBadge";

export function Transcript({
  transcript,
  roster,
  coachingMode,
  isProcessingTurn,
  currentSpeakerName,
}: {
  transcript: TranscriptEntry[];
  roster: Participant[];
  coachingMode: boolean;
  isProcessingTurn: boolean;
  currentSpeakerName: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript.length, isProcessingTurn]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
      {transcript.length === 0 && (
        <p className="text-sm text-muted text-center py-10">The discussion is about to begin…</p>
      )}
      {transcript.map((entry) => {
        const target = entry.targetParticipantId ? roster.find((r) => r.id === entry.targetParticipantId) : null;
        const persona = entry.personaId ? PERSONAS[entry.personaId] : null;
        return (
          <div key={entry.id} className={`entry-in flex gap-3 ${entry.speakerType === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                entry.speakerType === "user" ? "bg-navy text-white" : "bg-surface-muted"
              }`}
            >
              {entry.speakerType === "user" ? "🎤" : persona?.avatar || "👤"}
            </div>
            <div className={`max-w-[75%] ${entry.speakerType === "user" ? "items-end flex flex-col" : ""}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-semibold">{entry.speakerName}</span>
                {entry.isInterruption && (
                  <span className="text-[10px] text-accent font-medium">interrupting</span>
                )}
                {target && (
                  <span className="text-[10.5px] text-muted">&rarr; {target.name}</span>
                )}
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  entry.speakerType === "user"
                    ? "bg-navy text-white rounded-tr-sm"
                    : "bg-surface-muted rounded-tl-sm"
                }`}
              >
                {entry.content}
              </div>
              {coachingMode && entry.coachingTag && (
                <div className="mt-1.5">
                  <CoachingBadge tag={entry.coachingTag} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      {isProcessingTurn && (
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-surface-muted shrink-0" />
          <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-surface-muted text-sm text-muted flex items-center gap-1.5">
            <span className="speaking-dot h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="speaking-dot h-1.5 w-1.5 rounded-full bg-muted [animation-delay:0.15s]" />
            <span className="speaking-dot h-1.5 w-1.5 rounded-full bg-muted [animation-delay:0.3s]" />
            {currentSpeakerName && <span className="ml-1.5 text-xs">{currentSpeakerName} is thinking…</span>}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
