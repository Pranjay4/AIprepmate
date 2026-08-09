import { NextRequest, NextResponse } from "next/server";
import { generateTopic } from "@/lib/ai/topic-generator";
import { buildRoster } from "@/lib/personas";
import { AIProviderError } from "@/lib/ai/providers";
import type { GDSettings, Participant } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { settings: GDSettings; userName: string };
    const { settings, userName } = body;

    const generated = await generateTopic(settings.category, settings.difficulty, settings.customTopicPrompt);

    const aiRoster = buildRoster(settings.participantCount === 10 ? 10 : settings.participantCount === 8 ? 8 : 6);
    // Trim to leave one slot for the human among the requested participant count.
    const aiSlots = aiRoster.slice(0, settings.participantCount - 1);

    const participants: Participant[] = [
      ...aiSlots.map((p, i) => ({
        id: `ai-${i}`,
        personaId: p.personaId,
        name: p.name,
        isUser: false,
      })),
      { id: "user", personaId: "analyst", name: userName || "You", isUser: true },
    ];

    return NextResponse.json({
      topic: generated.topic,
      context: generated.context,
      participants,
    });
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 424 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to start GD." }, { status: 500 });
  }
}
