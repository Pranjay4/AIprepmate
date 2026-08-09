import type { Difficulty, TopicCategory } from "@/lib/schema";

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  beginner: "The topic should be clear-cut with fairly obvious arguments on 2 sides. Suitable for a first-time GD participant.",
  intermediate: "The topic should require considering multiple perspectives (not just 2 sides) to do well.",
  placement: "The topic should require business, social, and economic thinking together — the kind used in actual MBA placement GDs.",
  elite: "The topic should be deliberately ambiguous or narrow (including possibly a single abstract word or phrase). The strongest response requires reframing the question itself, not just answering it at face value.",
};

const CATEGORY_GUIDANCE: Record<Exclude<TopicCategory, "custom">, string> = {
  "current-affairs": "Base it on realistic, recent-feeling business or geopolitical developments (you do not have live web access — invent a plausible, realistically dated scenario rather than claiming a specific real headline).",
  technology: "Focus on AI, automation, cybersecurity, data privacy, or emerging tech and its business/social implications.",
  business: "Focus on startups, corporate strategy, brand strategy, or business ethics.",
  economics: "Focus on macroeconomics, trade, growth models, or labor economics relevant to India/global emerging markets.",
  marketing: "Focus on brand strategy, consumer behavior, advertising, or marketing ethics.",
  abstract: "Give a short evocative phrase or single word (like 'The Bridge' or 'Silence Speaks') rather than a full sentence question.",
  "social-issues": "Focus on education, work culture, diversity, or societal shifts with a business/policy angle.",
};

export const TOPIC_GENERATOR_SYSTEM_PROMPT = `You are the Topic Generator for an MBA placement Group Discussion (GD) simulator.
You produce a single, realistic GD topic — the kind a placement committee at a top business school would actually use.
Do not produce a topic that is trivially one-sided. Provide brief neutral context (1-2 sentences) that a moderator might give before the GD starts, and 2-6 short suggested angles participants could take (these are for internal use to seed AI participants — do not reveal them as "the answer").
Keep the topic itself to a single sentence or short phrase.`;

export function buildTopicGenerationPrompt(
  category: Exclude<TopicCategory, "custom">,
  difficulty: Difficulty
): string {
  return `Generate one GD topic.
Category: ${category}
${CATEGORY_GUIDANCE[category]}

Difficulty: ${difficulty}
${DIFFICULTY_GUIDANCE[difficulty]}`;
}

export function buildCustomTopicPrompt(userPrompt: string, difficulty: Difficulty): string {
  return `The user wants to discuss a custom topic area described as: "${userPrompt}".
Turn this into one well-formed, debatable GD topic suitable for an MBA placement GD.
Difficulty: ${difficulty}
${DIFFICULTY_GUIDANCE[difficulty]}`;
}
