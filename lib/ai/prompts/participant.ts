import type { Difficulty, IntelligenceLevel, Participant, Persona, TranscriptEntry } from "@/lib/schema";

const INTELLIGENCE_GUIDANCE: Record<IntelligenceLevel, string> = {
  mixed: "The group has a realistic mix of strong, average, and weak candidates — play your persona's natural quality level honestly, don't artificially elevate it.",
  strong: "Most participants in this GD are fairly strong candidates — lean toward the sharper end of your persona's natural range, but keep the persona's distinct voice.",
  elite: "This is a consulting-firm-level elite GD — even your persona's weaker traits (e.g. hesitation, genericness) should come with real substance underneath; the bar for insight is high across the board.",
};

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  beginner: "Keep reasoning fairly simple and direct.",
  intermediate: "Bring in at least one non-obvious angle.",
  placement: "Reason like an actual MBA placement candidate — connect business, economic, or social stakeholder implications.",
  elite: "Reason at a consulting-interview level — be willing to question the topic's framing itself.",
}

export const PARTICIPANT_SYSTEM_PROMPT_HEADER = `You are role-playing ONE candidate in a live MBA placement Group Discussion (GD) with several other candidates and one human user.
You are NOT an AI assistant helping someone — you are a peer competing/participating alongside them. Never say things like "That's a great point!", never offer to help, never break character, never refer to yourself as an AI.
Speak the way a real candidate speaks out loud in a discussion: natural, sometimes informal, not a polished essay every time. Contractions are fine. You can start mid-thought ("Yeah, but..."), reference another speaker by name, occasionally hesitate, and you do NOT need perfect structure every single time.
Keep your response to 1-4 sentences in almost all cases — this is spoken discussion, not a written submission. Only go longer if your persona is a big talker and the moment calls for it.
Do not repeat a point you or someone else already made unless your persona specifically tends to do that (some do — check your persona description).`;

export function buildParticipantSystemPrompt(
  persona: Persona,
  difficulty: Difficulty,
  intelligence: IntelligenceLevel
): string {
  return `${PARTICIPANT_SYSTEM_PROMPT_HEADER}

Your persona: ${persona.archetype}
Your traits: ${persona.traits.join(", ")}
Your speaking style: ${persona.speakingStyle}
${persona.systemPromptFragment}

GD difficulty level: ${difficulty}. ${DIFFICULTY_GUIDANCE[difficulty]}
Group intelligence calibration: ${INTELLIGENCE_GUIDANCE[intelligence]}

Respond only using the structured tool call. Set "reason" to whichever best describes what you're doing (new-point, build-on, rebuttal, agreement, clarification, reframe, closing, interruption). Set "targetParticipant" to the name of whoever you're most directly responding to, if any. Set "confidence" (0-1) to how sure you personally are of what you just said — this can be below 1 even when you sound confident, and should be lower if your persona is the hesitant/weak type or you know your claim might be shaky.`;
}

export function buildParticipantUserPrompt(params: {
  topic: string;
  topicContext: string;
  roster: Participant[];
  transcript: TranscriptEntry[];
  selfId: string;
  elapsedSeconds: number;
  totalSeconds: number;
  isOpening: boolean;
  isInterruption: boolean;
}): string {
  const { topic, topicContext, roster, transcript, selfId, elapsedSeconds, totalSeconds, isOpening, isInterruption } = params;
  const rosterLine = roster.map((p) => `${p.name}${p.id === selfId ? " (you)" : ""}${p.isUser ? " [human]" : ""}`).join(", ");

  const recentTranscript = transcript
    .slice(-14)
    .map((t) => `${t.speakerName}: ${t.content}`)
    .join("\n");

  const ownPriorLines = transcript
    .filter((t) => t.speakerId === selfId)
    .map((t) => `- ${t.content}`)
    .join("\n");

  return `GD Topic: "${topic}"
Context given at the start: ${topicContext}

Participants in this GD: ${rosterLine}

Time: ${Math.round(elapsedSeconds)}s elapsed of ${totalSeconds}s total.

${
  isOpening
    ? "Nobody has spoken yet. You are opening the discussion — set the frame briefly, don't try to say everything."
    : `Recent discussion (most recent last):\n${recentTranscript || "(no lines yet)"}`
}

${ownPriorLines ? `Your own earlier lines in this GD, so far:\n${ownPriorLines}\n\nDo not just repeat these unless your persona specifically tends to.` : ""}

${isInterruption ? "You are jumping in / interrupting the flow rather than waiting your turn — keep it especially short and punchy." : ""}

Now give your next contribution to the discussion as this persona.`;
}
