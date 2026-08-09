import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ZodTypeAny, z } from "zod";
import { AIProvider, AIProviderError, StructuredCompletionOptions } from "./types";
import { toPlainJsonSchema } from "./jsonSchema";

export function createGeminiProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  return {
    name: "gemini",
    async completeStructured<S extends ZodTypeAny>(
      opts: StructuredCompletionOptions<S>
    ): Promise<z.infer<S>> {
      if (!apiKey) {
        throw new AIProviderError(
          "GEMINI_API_KEY is not set. Add it to .env.local (see .env.local.example) or switch AI_PROVIDER."
        );
      }
      const client = new GoogleGenerativeAI(apiKey);
      const jsonSchema = toPlainJsonSchema(opts.schema);

      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: opts.system,
        generationConfig: {
          temperature: opts.temperature ?? 0.9,
          maxOutputTokens: opts.maxTokens ?? 1024,
          responseMimeType: "application/json",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          responseSchema: jsonSchema as any,
        },
      });

      const conversation = opts.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
      const result = await model.generateContent(conversation);
      const raw = result.response.text();
      if (!raw) {
        throw new AIProviderError("Gemini response did not include structured output.");
      }
      return opts.schema.parse(JSON.parse(raw));
    },
  };
}
