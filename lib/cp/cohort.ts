import type { RoleId } from "./types";
import { ROLES } from "./content/roles";
import { mulberry32 } from "./util";

// Synthetic cohort for the institutional dashboard demo. Generated deterministically
// from a fixed seed — it does not describe real students.

export const MIN_GROUP_SIZE = 10;

interface SynthStudent {
  role: RoleId;
  activated: boolean;
  weeksActive: boolean[];
  plannedCompletion: number;
  practiceStarted: number[];
  practiceSubmitted: number[];
  topicScores: Record<string, number>;
}

const ROLE_WEIGHTS: [RoleId, number][] = [["ba", 0.3], ["pm", 0.18], ["marketing", 0.17], ["finance", 0.16], ["consulting", 0.14], ["software", 0.05]];
const WEEKS = 8;

function buildCohort(): SynthStudent[] {
  const rand = mulberry32(20261011);
  const out: SynthStudent[] = [];
  for (let i = 0; i < 148; i++) {
    let x = rand();
    let role: RoleId = "ba";
    for (const [r, w] of ROLE_WEIGHTS) {
      if (x < w) { role = r; break; }
      x -= w;
    }
    const engagement = 0.25 + rand() * 0.7;
    const activated = rand() < 0.55 + engagement * 0.4;
    const ability = 0.4 + rand() * 0.45;
    const weeksActive = Array.from({ length: WEEKS }, (_, w) => activated && rand() < engagement * (1 - w * 0.035));
    const practiceStarted = weeksActive.map((a) => (a ? 1 + Math.floor(rand() * 4) : 0));
    const practiceSubmitted = practiceStarted.map((s) => Math.round(s * (0.6 + rand() * 0.4)));
    const def = ROLES.find((r) => r.id === role)!;
    const topicScores = Object.fromEntries(def.topics.map((t, k) => [t, Math.round(Math.min(0.97, Math.max(0.2, ability + (rand() - 0.5) * 0.3 - k * 0.015)) * 100)]));
    out.push({ role, activated, weeksActive, plannedCompletion: activated ? Math.round(Math.min(1, engagement * (0.6 + rand() * 0.6)) * 100) : 0, practiceStarted, practiceSubmitted, topicScores });
  }
  return out;
}

let cache: SynthStudent[] | null = null;

export function cohortSummary(role: RoleId | "all") {
  cache ??= buildCohort();
  const all = cache;
  const group = role === "all" ? all : all.filter((s) => s.role === role);
  const byRole = ROLES.map((r) => ({ role: r.id, name: r.short, n: all.filter((s) => s.role === r.id).length }));
  if (group.length < MIN_GROUP_SIZE) return { suppressed: true as const, n: group.length, byRole };

  const active = group.filter((s) => s.activated);
  const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const weekly = Array.from({ length: WEEKS }, (_, w) => {
    const started = group.reduce((s, x) => s + x.practiceStarted[w], 0);
    const submitted = group.reduce((s, x) => s + x.practiceSubmitted[w], 0);
    return {
      week: `W${w + 1}`,
      activePct: Math.round((group.filter((s) => s.weeksActive[w]).length / group.length) * 100),
      completionPct: started ? Math.round((submitted / started) * 100) : 0,
      submitted,
    };
  });
  const topicMap = new Map<string, number[]>();
  for (const s of active) for (const [t, v] of Object.entries(s.topicScores)) topicMap.set(t, [...(topicMap.get(t) ?? []), v]);
  const topics = [...topicMap.entries()]
    .filter(([, v]) => v.length >= MIN_GROUP_SIZE)
    .map(([topic, v]) => ({ topic, pct: mean(v), n: v.length }))
    .sort((a, b) => a.pct - b.pct);
  const hiddenTopics = [...topicMap.values()].filter((v) => v.length < MIN_GROUP_SIZE).length;

  return {
    suppressed: false as const,
    n: group.length,
    byRole,
    activated: active.length,
    activationPct: Math.round((active.length / group.length) * 100),
    weeklyActivePct: weekly[WEEKS - 1].activePct,
    plannedCompletion: mean(active.map((s) => s.plannedCompletion)),
    weekly,
    topics,
    hiddenTopics,
  };
}
