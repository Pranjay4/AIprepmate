import { getAIProvider } from "./providers";
import { CoachPlanSchema, type CompletedSession } from "@/lib/schema";
import { COACH_PLAN_SYSTEM_PROMPT, buildCoachPlanPrompt } from "./prompts/coach";

export async function generateCoachPlan(sessions: CompletedSession[]) {
  const provider = getAIProvider();
  return provider.completeStructured({
    system: COACH_PLAN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildCoachPlanPrompt(sessions) }],
    schema: CoachPlanSchema,
    schemaName: "coach_plan",
    maxTokens: 900,
    temperature: 0.7,
  });
}
