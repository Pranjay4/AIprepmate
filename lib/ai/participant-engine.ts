import { getAIProvider } from "./providers";
import { ParticipantActionSchema, type Difficulty, type IntelligenceLevel, type Participant, type Persona, type TranscriptEntry } from "@/lib/schema";
import { buildParticipantSystemPrompt, buildParticipantUserPrompt } from "./prompts/participant";

export interface ParticipantTurnParams {
  persona: Persona;
  difficulty: Difficulty;
  intelligence: IntelligenceLevel;
  topic: string;
  topicContext: string;
  roster: Participant[];
  transcript: TranscriptEntry[];
  selfId: string;
  elapsedSeconds: number;
  totalSeconds: number;
  isOpening: boolean;
  isInterruption: boolean;
}

export async function generateParticipantTurn(params: ParticipantTurnParams) {
  const provider = getAIProvider();
  const system = buildParticipantSystemPrompt(params.persona, params.difficulty, params.intelligence);
  const user = buildParticipantUserPrompt(params);

  return provider.completeStructured({
    system,
    messages: [{ role: "user", content: user }],
    schema: ParticipantActionSchema,
    schemaName: "participant_action",
    maxTokens: 350,
    temperature: 1.05,
  });
}
