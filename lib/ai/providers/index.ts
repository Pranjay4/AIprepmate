import type { AIProvider } from "./types";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAIProvider } from "./openai";
import { createGeminiProvider } from "./gemini";

export type ProviderKey = "anthropic" | "openai" | "gemini";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const key = (process.env.AI_PROVIDER || "anthropic").toLowerCase() as ProviderKey;
  switch (key) {
    case "openai":
      cached = createOpenAIProvider();
      break;
    case "gemini":
      cached = createGeminiProvider();
      break;
    case "anthropic":
    default:
      cached = createAnthropicProvider();
      break;
  }
  return cached;
}

export type { AIProvider, AIProviderMessage, StructuredCompletionOptions } from "./types";
export { AIProviderError } from "./types";
