import { NextRequest, NextResponse } from "next/server";
import { runNextTurn } from "@/lib/ai/turn-manager";
import { AIProviderError } from "@/lib/ai/providers";
import type { GDSettings, Participant, TranscriptEntry } from "@/lib/schema";

interface TurnRequestBody {
  topic: string;
  topicContext: string;
  roster: Participant[];
  transcript: TranscriptEntry[];
  settings: GDSettings;
  elapsedSeconds: number;
  totalSeconds: number;
  userLastSpokeAtSeconds: number | null;
  excludeUserOpportunity?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TurnRequestBody;
    const result = await runNextTurn(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 424 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to compute next turn." }, { status: 500 });
  }
}
