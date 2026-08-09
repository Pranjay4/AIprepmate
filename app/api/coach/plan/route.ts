import { NextRequest, NextResponse } from "next/server";
import { generateCoachPlan } from "@/lib/ai/coach";
import { AIProviderError } from "@/lib/ai/providers";
import type { CompletedSession } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const { sessions } = (await req.json()) as { sessions: CompletedSession[] };
    if (!sessions || sessions.length < 2) {
      return NextResponse.json(
        { error: "Complete at least 2 GD sessions before generating a personalized coaching plan." },
        { status: 400 }
      );
    }
    const plan = await generateCoachPlan(sessions);
    return NextResponse.json(plan);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 424 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to generate a coaching plan." }, { status: 500 });
  }
}
