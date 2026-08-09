import OpenAI from "openai";
import type { ZodTypeAny, z } from "zod";
import { AIProvider, AIProviderError, StructuredCompletionOptions } from "./types";
import { toPlainJsonSchema } from "./jsonSchema";

export function createOpenAIProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1";

  return {
    name: "openai",
    async completeStructured<S extends ZodTypeAny>(
      opts: StructuredCompletionOptions<S>
    ): Promise<z.infer<S>> {
      if (!apiKey) {
        throw new AIProviderError(
          "OPENAI_API_KEY is not set. Add it to .env.local (see .env.local.example) or switch AI_PROVIDER."
        );
      }
      const client = new OpenAI({ apiKey });
      const jsonSchema = toPlainJsonSchema(opts.schema);

      const response = await client.chat.completions.create({
        model,
        temperature: opts.temperature ?? 0.9,
        max_tokens: opts.maxTokens ?? 1024,
        messages: [
          { role: "system", content: opts.system },
          ...opts.messages.map((m) => ({ role: m.role, content: m.content }) as const),
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: opts.schemaName,
            schema: jsonSchema,
            strict: false,
          },
        },
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        throw new AIProviderError("OpenAI response did not include structured output.");
      }
      return opts.schema.parse(JSON.parse(raw));
    },
  };
}
