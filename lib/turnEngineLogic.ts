import type { Participant, Persona, PersonaId, RealismLevel, RealismSettings, TranscriptEntry } from "./schema";

export const USER_OPPORTUNITY = "user-opportunity";

const LEVEL_MULT: Record<RealismLevel, number> = { low: 0.5, medium: 1, high: 1.9 };

export interface TurnEngineInput {
  aiParticipants: Participant[];
  personas: Record<PersonaId, Persona>;
  transcript: TranscriptEntry[];
  realism: RealismSettings;
  elapsedSeconds: number;
  userLastSpokeAtSeconds: number | null;
  /** true after a user-opportunity slot timed out with no response — re-roll excluding the user */
  excludeUserOpportunity?: boolean;
}

export interface TurnEngineResult {
  speakerId: string; // participant id, or USER_OPPORTUNITY
  isInterruption: boolean;
}

function turnsSinceSpoke(transcript: TranscriptEntry[], id: string): number {
  for (let i = transcript.length - 1, back = 0; i >= 0; i--, back++) {
    if (transcript[i].speakerId === id) return back;
  }
  return transcript.length + 2;
}

export function selectNextSpeaker(input: TurnEngineInput): TurnEngineResult {
  const { aiParticipants, personas, transcript, realism, elapsedSeconds, userLastSpokeAtSeconds, excludeUserOpportunity } = input;
  const lastEntry = transcript[transcript.length - 1];

  const candidates: { id: string; weight: number }[] = [];

  for (const p of aiParticipants) {
    if (lastEntry && lastEntry.speakerId === p.id) continue; // avoid immediate self-repeat
    const persona = personas[p.personaId!];
    let weight = persona.baseWeight;

    const sinceSpoke = turnsSinceSpoke(transcript, p.id);
    weight *= 1 + Math.min(sinceSpoke, 6) * 0.25;

    if (lastEntry?.flags?.controversial || lastEntry?.reason === "rebuttal") {
      weight *= 1 + persona.interruptBias * 1.5;
    }

    const chaosMult = LEVEL_MULT[realism.chaos];
    weight *= 1 + (Math.random() - 0.3) * 0.6 * chaosMult;
    weight = Math.max(weight, 0.05);

    candidates.push({ id: p.id, weight });
  }

  if (!excludeUserOpportunity) {
    const sinceUser = userLastSpokeAtSeconds === null ? elapsedSeconds : elapsedSeconds - userLastSpokeAtSeconds;
    const silenceRatio = Math.min(Math.max(sinceUser, 0) / 45, 3);
    const userWeight = 0.5 + silenceRatio * 0.9;
    candidates.push({ id: USER_OPPORTUNITY, weight: userWeight });
  }

  if (candidates.length === 0) {
    // Fallback: everyone excluded (tiny roster edge case) — allow anyone but last speaker.
    for (const p of aiParticipants) candidates.push({ id: p.id, weight: 1 });
  }

  const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosen = candidates[0];
  for (const c of candidates) {
    if (roll < c.weight) {
      chosen = c;
      break;
    }
    roll -= c.weight;
  }

  let isInterruption = false;
  if (chosen.id !== USER_OPPORTUNITY && transcript.length > 0) {
    const speaker = aiParticipants.find((p) => p.id === chosen.id);
    if (speaker) {
      const persona = personas[speaker.personaId!];
      const interruptMult = LEVEL_MULT[realism.interruptionFrequency];
      const chance = persona.interruptBias * 0.35 * interruptMult;
      isInterruption = Math.random() < chance;
    }
  }

  return { speakerId: chosen.id, isInterruption };
}

export function selectOpeningSpeaker(aiParticipants: Participant[], personas: Record<PersonaId, Persona>): string {
  const result = selectNextSpeaker({
    aiParticipants,
    personas,
    transcript: [],
    realism: { aiAggression: "medium", aiIntelligence: "mixed", interruptionFrequency: "low", chaos: "low", timePressure: "medium" },
    elapsedSeconds: 0,
    userLastSpokeAtSeconds: null,
    excludeUserOpportunity: true,
  });
  return result.speakerId;
}

/** Simulated speaking duration in ms, so the transcript doesn't scroll unnaturally fast. */
export function computeSpeakingDurationMs(content: string, timePressure: RealismLevel): number {
  const words = content.trim().split(/\s+/).length;
  const wpm = 145; // average spoken pace
  const baseMs = (words / wpm) * 60_000;
  const pressureMult = timePressure === "high" ? 0.65 : timePressure === "low" ? 1.2 : 1;
  return Math.min(Math.max(baseMs * pressureMult, 900), 9000);
}

/** How long to wait for the user to jump in before re-rolling to an AI speaker. */
export function userOpportunityTimeoutMs(timePressure: RealismLevel): number {
  return timePressure === "high" ? 14_000 : timePressure === "low" ? 30_000 : 20_000;
}
