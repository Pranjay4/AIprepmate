// Used for the standalone "rebuttal drill" exercise (Phase 2 coaching), where the
// user is given an AI argument and must respond quickly. The end-of-GD
// "counterargument training" section is produced directly by the evaluator
// (see prompts/evaluator.ts) since it shares the same transcript context.

export const REBUTTAL_CHALLENGE_SYSTEM_PROMPT = `You generate a single, sharp GD-style argument on a given topic, delivered the way a confident GD participant would say it out loud (1-3 sentences). It should be a real, well-reasoned position — not a strawman — so that rebutting it is genuinely useful practice. Return only the argument itself.`;

export function buildRebuttalChallengePrompt(topic: string): string {
  return `Topic: "${topic}"\n\nGive one confident, well-reasoned argument on this topic for the user to practice rebutting.`;
}

export const REBUTTAL_FEEDBACK_SYSTEM_PROMPT = `You are a GD rebuttal coach. Given an argument and the user's rebuttal to it, give brief, honest feedback (2-3 sentences max): did they address the actual substance of the argument, or just disagree without engaging? Was it concise? Then give one sentence showing a stronger rebuttal if theirs had a real gap. Do not be generically encouraging if the rebuttal was weak.`;

export function buildRebuttalFeedbackPrompt(argument: string, userRebuttal: string): string {
  return `Argument given: "${argument}"\n\nUser's rebuttal: "${userRebuttal}"\n\nGive feedback.`;
}
