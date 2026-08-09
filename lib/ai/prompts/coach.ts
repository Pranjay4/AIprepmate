import type { CompletedSession } from "@/lib/schema";

export const LIVE_COACHING_SYSTEM_PROMPT = `You are a live GD coaching-tag classifier. You look at ONE user contribution in the context of a small amount of recent discussion and return exactly one short tag plus a very short (max 8 words) note. Never return praise-only fluff. Prefer specific, honest tags over generous ones. Available tags: strong-entry, strong-point, good-rebuttal, weak-example, repetition, too-long, good-build, unsupported-claim. Pick the single most salient one.`;

export function buildLiveCoachingPrompt(recentTranscript: string, latestUserLine: string): string {
  return `Recent discussion:\n${recentTranscript}\n\nThe user just said:\n"${latestUserLine}"\n\nReturn one coaching tag for this specific contribution.`;
}

export const COACH_PLAN_SYSTEM_PROMPT = `You are a personalized MBA placement GD coach. You look at a user's history of completed GD sessions (scores + recurring weakness tags) and identify genuine recurring patterns — not generic advice. Be specific ("You frequently start with 'I think' and hedge your opening" is good; "communicate more clearly" is not allowed).

Based on the single most impactful recurring weakness, choose ONE exerciseType:
- structure-drill: if the user struggles with structure/flow. Generate topics they must answer strictly as POSITION -> REASON -> EXAMPLE -> CONCLUSION.
- rebuttal-drill: if the user struggles with handling disagreement. Generate a short AI argument for them to rebut.
- content-drill: if the user struggles with depth/originality/business thinking. Generate topics requiring stakeholder/economic reasoning.
- listening-drill: if the user struggles with building on others / repeats points. Generate short transcripts and ask the user to respond by building on a specific prior speaker.

Generate 4-10 concrete exercise prompts for the chosen drill type.`;

export function buildCoachPlanPrompt(sessions: CompletedSession[]): string {
  const summary = sessions
    .map(
      (s, i) =>
        `Session ${i + 1} (${s.dateIso.slice(0, 10)}): overall ${s.report.overallScore}/100, weaknesses: ${s.report.weaknesses.join(
          " | "
        )}`
    )
    .join("\n");
  return `User's session history:\n${summary}\n\nIdentify the recurring pattern and produce a coaching plan.`;
}
