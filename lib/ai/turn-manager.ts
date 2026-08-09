import { PERSONAS } from "@/lib/personas";
import { selectNextSpeaker, USER_OPPORTUNITY, type TurnEngineInput } from "@/lib/turnEngineLogic";
import { generateParticipantTurn } from "./participant-engine";
import type { Difficulty, GDSettings, Participant, TranscriptEntry } from "@/lib/schema";

export interface TurnManagerParams {
  topic: string;
  topicContext: string;
  roster: Participant[];
  transcript: TranscriptEntry[];
  settings: GDSettings;
  elapsedSeconds: number;
  totalSeconds: number;
  userLastSpokeAtSeconds: number | null;
  excludeUserOpportunity?: boolean;
}

export type TurnManagerResult =
  | { type: "user-opportunity" }
  | {
      type: "ai-turn";
      entry: {
        speakerId: string;
        speakerName: string;
        personaId: Participant["personaId"];
        content: string;
        reason: TranscriptEntry["reason"];
        targetParticipantId?: string;
        confidence: number;
        isInterruption: boolean;
        flags?: TranscriptEntry["flags"];
      };
    };

export async function runNextTurn(params: TurnManagerParams): Promise<TurnManagerResult> {
  const aiParticipants = params.roster.filter((p) => !p.isUser);

  const engineInput: TurnEngineInput = {
    aiParticipants,
    personas: PERSONAS,
    transcript: params.transcript,
    realism: params.settings.realism,
    elapsedSeconds: params.elapsedSeconds,
    userLastSpokeAtSeconds: params.userLastSpokeAtSeconds,
    excludeUserOpportunity: params.excludeUserOpportunity,
  };

  const { speakerId, isInterruption } = selectNextSpeaker(engineInput);

  if (speakerId === USER_OPPORTUNITY) {
    return { type: "user-opportunity" };
  }

  const speaker = aiParticipants.find((p) => p.id === speakerId);
  if (!speaker) {
    // Extremely unlikely fallback if roster is empty of eligible speakers.
    return { type: "user-opportunity" };
  }

  const persona = PERSONAS[speaker.personaId!];
  const isOpening = params.transcript.length === 0;

  const action = await generateParticipantTurn({
    persona,
    difficulty: params.settings.difficulty as Difficulty,
    intelligence: params.settings.realism.aiIntelligence,
    topic: params.topic,
    topicContext: params.topicContext,
    roster: params.roster,
    transcript: params.transcript,
    selfId: speaker.id,
    elapsedSeconds: params.elapsedSeconds,
    totalSeconds: params.totalSeconds,
    isOpening,
    isInterruption,
  });

  const targetParticipant = params.roster.find(
    (p) => p.name.toLowerCase() === (action.targetParticipant || "").toLowerCase()
  );

  return {
    type: "ai-turn",
    entry: {
      speakerId: speaker.id,
      speakerName: speaker.name,
      personaId: speaker.personaId,
      content: action.content,
      reason: action.reason,
      targetParticipantId: targetParticipant?.id,
      confidence: action.confidence,
      isInterruption,
      flags: action.flags,
    },
  };
}
