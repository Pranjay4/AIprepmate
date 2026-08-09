import { NextRequest, NextResponse } from "next/server";
import { getAIProvider, AIProviderError } from "@/lib/ai/providers";
import { z } from "zod";
import {
  REBUTTAL_CHALLENGE_SYSTEM_PROMPT,
  buildRebuttalChallengePrompt,
  REBUTTAL_FEEDBACK_SYSTEM_PROMPT,
  buildRebuttalFeedbackPrompt,
} from "@/lib/ai/prompts/rebuttal";

const ChallengeSchema = z.object({ argument: z.string() });
const FeedbackSchema = z.object({ feedback: z.string(), strongerRebuttal: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as
      | { action: "challenge"; topic: string }
      | { action: "feedback"; argument: string; userRebuttal: string };

    const provider = getAIProvider();

    if (body.action === "challenge") {
      const result = await provider.completeStructured({
        system: REBUTTAL_CHALLENGE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildRebuttalChallengePrompt(body.topic) }],
        schema: ChallengeSchema,
        schemaName: "rebuttal_challenge",
        maxTokens: 200,
        temperature: 1.0,
      });
      return NextResponse.json(result);
    }

    const result = await provider.completeStructured({
      system: REBUTTAL_FEEDBACK_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildRebuttalFeedbackPrompt(body.argument, body.userRebuttal) }],
      schema: FeedbackSchema,
      schemaName: "rebuttal_feedback",
      maxTokens: 300,
      temperature: 0.6,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 424 });
    }
    console.error(err);
    return NextResponse.json({ error: "Rebuttal drill failed." }, { status: 500 });
  }
}
