import Anthropic from "@anthropic-ai/sdk";
import type { ZodTypeAny, z } from "zod";
import { AIProvider, AIProviderError, StructuredCompletionOptions } from "./types";
import { toPlainJsonSchema } from "./jsonSchema";

export function createAnthropicProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  return {
    name: "anthropic",
    async completeStructured<S extends ZodTypeAny>(
      opts: StructuredCompletionOptions<S>
    ): Promise<z.infer<S>> {
      if (!apiKey) {
        throw new AIProviderError(
          "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.local.example) or switch AI_PROVIDER."
        );
      }
      const client = new Anthropic({ apiKey });
      const jsonSchema = toPlainJsonSchema(opts.schema);

      const response = await client.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.9,
        system: opts.system,
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
        tools: [
          {
            name: opts.schemaName,
            description: `Return the result as structured data matching ${opts.schemaName}.`,
            input_schema: jsonSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: opts.schemaName },
      });

      const toolUse = response.content.find((block) => block.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new AIProviderError("Anthropic response did not include structured tool output.");
      }
      return opts.schema.parse(toolUse.input);
    },
  };
}
