import { NextRequest, NextResponse } from "next/server";
import { evaluateGD, type EvaluateParams } from "@/lib/ai/evaluator";
import { AIProviderError } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvaluateParams;
    if (body.transcript.filter((t) => t.speakerType === "user").length === 0) {
      return NextResponse.json({ error: "The user did not speak in this GD, so there is nothing to evaluate." }, { status: 400 });
    }
    const report = await evaluateGD(body);
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return NextResponse.json({ error: err.message }, { status: 424 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to evaluate the GD." }, { status: 500 });
  }
}
