import type { ZodTypeAny, z } from "zod";

export interface AIProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StructuredCompletionOptions<S extends ZodTypeAny> {
  system: string;
  messages: AIProviderMessage[];
  schema: S;
  schemaName: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  name: string;
  completeStructured<S extends ZodTypeAny>(opts: StructuredCompletionOptions<S>): Promise<z.infer<S>>;
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
