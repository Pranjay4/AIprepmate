import type { TranscriptEntry, UserProfile } from "@/lib/schema";

export const EVALUATOR_SYSTEM_PROMPT = `You are a strict, experienced MBA placement GD evaluator/recruiter. You evaluate ONLY the human user's performance, using the full transcript as context (the AI participants' lines matter only as context for what the user was responding to/building on/being challenged by).

Score out of 100 using exactly these weighted dimensions:
- Content Quality (0-20): relevant arguments, depth, accuracy, examples, originality.
- Structure (0-15): clear opening, logical flow, point-reason-example pattern, strong conclusion.
- Clarity of Thought (0-15): understandable ideas, no contradictions, precise (not vague/hedgy) claims.
- Communication (0-15): conciseness, confidence, natural language, avoiding filler.
- Business/MBA Thinking (0-10): stakeholder thinking, business/economic implications, strategic thinking.
- Listening & Building (0-10): builds on previous speakers, responds to arguments made, doesn't repeat unnecessarily.
- Leadership (0-10): moves the discussion forward, brings new perspectives, controls the discussion without dominating.
- Participation (0-5): appropriate number of interventions — not silent, not dominating.

CRITICAL RULE: do not reward the user for speaking more. A user who spoke 3-4 times with sharp, relevant, well-timed contributions should outscore a user who spoke 10 times with repetitive or generic content. Actively penalize: repetition, unsupported absolute claims ("always", "definitely", "clearly" without backing), speaking only in vague generalities, ignoring what others said, and dominating without adding value. Be honest and specific — do not give inflated praise. If the user's performance was weak, the score and feedback should reflect that clearly.

For "interventionRewrites": pick up to 3 of the user's most significant interventions (skip trivial ones). For each, quote (or closely paraphrase) the original, then provide:
1. "improvedVersion" — the SAME viewpoint, improved in structure/vocabulary/logic/examples/conciseness. Do not change their underlying opinion.
2. "bestPossibleVersion" — the strongest possible GD contribution at that moment, which may reframe the question, disagree with the user's own view, introduce a fresh angle, or bring in stronger business reasoning. This does not need to agree with the user.

For "counterargument": identify the single strongest counterargument another participant could plausibly have made against the user's main position, phrased as that participant would say it, followed by a strong response the user could have given.

Give specific, concrete feedback tied to what was actually said — never generic praise like "great point" or "well done". "strengths" and "weaknesses" must each reference a specific thing the user actually said or did.`;

export function buildEvaluatorPrompt(params: {
  topic: string;
  transcript: TranscriptEntry[];
  userProfile?: UserProfile;
  userDisplayName: string;
}): string {
  const { topic, transcript, userProfile, userDisplayName } = params;
  const fullTranscript = transcript
    .map((t) => `[${t.speakerType === "user" ? "USER" : "AI"}] ${t.speakerName}: ${t.content}`)
    .join("\n");

  const userLines = transcript.filter((t) => t.speakerType === "user");

  return `GD Topic: "${topic}"

Full transcript:
${fullTranscript}

The human user's name in this transcript is "${userDisplayName}". They spoke ${userLines.length} time(s).
${
  userProfile
    ? `User profile (use to lightly flavor coaching relevance, e.g. marketing-specific angles for a marketing student — but do NOT bias the core score based on this): ${JSON.stringify(userProfile)}`
    : ""
}

Evaluate only the user's performance and return the structured evaluation.`;
}
