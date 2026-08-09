import { NextRequest, NextResponse } from "next/server";
import { getAIProvider, AIProviderError } from "@/lib/ai/providers";
import { CoachingTagSchema } from "@/lib/schema";
import { LIVE_COACHING_SYSTEM_PROMPT, buildLiveCoachingPrompt } from "@/lib/ai/prompts/coach";

export async function POST(req: NextRequest) {
  try {
    const { recentTranscript, latestUserLine } = (await req.json()) as {
      recentTranscript: string;
      latestUserLine: string;
    };
    const provider = getAIProvider();
    const result = await provider.completeStructured({
      system: LIVE_COACHING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildLiveCoachingPrompt(recentTranscript, latestUserLine) }],
      schema: CoachingTagSchema,
      schemaName: "coaching_tag",
      maxTokens: 100,
      temperature: 0.4,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 424 });
    }
    return NextResponse.json({ error: "tag failed" }, { status: 500 });
  }
}
