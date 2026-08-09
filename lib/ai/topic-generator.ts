import { getAIProvider } from "./providers";
import { TopicGenerationSchema, type Difficulty, type TopicCategory } from "@/lib/schema";
import {
  TOPIC_GENERATOR_SYSTEM_PROMPT,
  buildTopicGenerationPrompt,
  buildCustomTopicPrompt,
} from "./prompts/topicGenerator";
import { pickRandomSeedTopic } from "@/lib/topics";

export interface GeneratedTopic {
  topic: string;
  context: string;
  suggestedAngles: string[];
}

export async function generateTopic(
  category: TopicCategory,
  difficulty: Difficulty,
  customPrompt?: string
): Promise<GeneratedTopic> {
  const provider = getAIProvider();
  const userPrompt =
    category === "custom" ? buildCustomTopicPrompt(customPrompt || "an interesting MBA GD topic", difficulty) : buildTopicGenerationPrompt(category, difficulty);

  try {
    const result = await provider.completeStructured({
      system: TOPIC_GENERATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      schema: TopicGenerationSchema,
      schemaName: "topic_generation",
      maxTokens: 400,
      temperature: 1.0,
    });
    return result;
  } catch (err) {
    if (category === "custom") throw err;
    const seed = pickRandomSeedTopic(category, difficulty);
    return { topic: seed.topic, context: seed.context, suggestedAngles: [] };
  }
}
