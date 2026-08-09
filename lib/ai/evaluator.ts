import { getAIProvider } from "./providers";
import { EvaluationReportSchema, type TranscriptEntry, type UserProfile } from "@/lib/schema";
import { EVALUATOR_SYSTEM_PROMPT, buildEvaluatorPrompt } from "./prompts/evaluator";

export interface EvaluateParams {
  topic: string;
  transcript: TranscriptEntry[];
  userProfile?: UserProfile;
  userDisplayName: string;
}

export async function evaluateGD(params: EvaluateParams) {
  const provider = getAIProvider();
  return provider.completeStructured({
    system: EVALUATOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildEvaluatorPrompt(params) }],
    schema: EvaluationReportSchema,
    schemaName: "evaluation_report",
    maxTokens: 3000,
    temperature: 0.6,
  });
}
