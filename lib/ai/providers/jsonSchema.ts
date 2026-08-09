import { z, type ZodTypeAny } from "zod";

// Converts a Zod schema to a plain JSON Schema object suitable for
// Anthropic tool input_schema / OpenAI json_schema / Gemini responseSchema,
// stripping the $schema key none of those providers want.
export function toPlainJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}
