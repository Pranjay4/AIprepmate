import type { Roadmap, RoadmapTask, RoleId, TimelineWeeks } from "./types";
import { PHASES, ROADMAP_TEMPLATES, type TaskTemplate } from "./content/roadmaps";
import { addDays, clamp, dayKey, diffDays, uid } from "./util";

const STUDY_DAYS_PER_WEEK = 6;

function toTask(t: TaskTemplate, week: number): RoadmapTask {
  return {
    id: uid("task"),
    key: t.key,
    week,
    dueDate: "",
    phase: PHASES[t.phase],
    title: t.title,
    description: t.description,
    topic: t.topic,
    difficulty: t.difficulty,
    durationMin: t.durationMin,
    objective: t.objective,
    notes: t.notes,
    moduleId: t.moduleId,
    practice: t.practice,
    interviewType: t.interviewType,
    status: "not_started",
  };
}

/**
 * Builds a weekly plan from the role's task templates.
 * - Core tasks are always included; standard and stretch tasks are added while they fit
 *   the time budget (weeks × 6 study days × minutes per day).
 * - Tasks keep their teaching order and are spread so each week carries a similar load.
 * - Longer plans (8+ weeks) get weekly review sets and fortnightly mock interviews if time allows.
 * - When `prev` is given, progress is carried over by task key.
 */
export function generateRoadmap(
  roleId: RoleId,
  weeks: TimelineWeeks,
  minutesPerDay: number,
  startDate: string = dayKey(),
  prev?: Roadmap | null
): Roadmap {
  const templates = ROADMAP_TEMPLATES[roleId];
  const budget = weeks * STUDY_DAYS_PER_WEEK * minutesPerDay;

  const chosen = new Set(templates.filter((t) => t.priority === "core").map((t) => t.key));
  let used = templates.filter((t) => chosen.has(t.key)).reduce((s, t) => s + t.durationMin, 0);
  for (const pri of ["standard", "stretch"] as const) {
    for (const t of templates) {
      if (t.priority === pri && used + t.durationMin <= budget) {
        chosen.add(t.key);
        used += t.durationMin;
      }
    }
  }
  const selected = templates.filter((t) => chosen.has(t.key));
  const total = selected.reduce((s, t) => s + t.durationMin, 0);

  let cum = 0;
  const tasks: RoadmapTask[] = selected.map((t) => {
    const mid = cum + t.durationMin / 2;
    cum += t.durationMin;
    return toTask(t, clamp(Math.floor((mid / total) * weeks) + 1, 1, weeks));
  });

  // Recurring extras for long plans, only while spare time remains.
  let spare = budget - total;
  if (weeks >= 8) {
    for (let w = 2; w < weeks; w++) {
      if (spare >= 25) {
        spare -= 25;
        tasks.push(
          toTask(
            {
              key: `review-w${w}`, phase: 2, priority: "standard", title: `Week ${w} review: mixed practice`,
              topic: "Revision", difficulty: "Medium", durationMin: 25,
              objective: "Keep earlier topics fresh with spaced practice",
              description: "A mixed set that favours the topics where your accuracy is lowest so far.",
              notes: ["Spaced repetition beats re-reading", "Review the explanation for every miss", "Save questions worth revisiting"],
              practice: { topics: [], count: 8 },
            },
            w
          )
        );
      }
      if (w % 2 === 0 && spare >= 30) {
        spare -= 30;
        const type = (["behavioural", "technical", "case", "role", "hr"] as const)[(w / 2) % 5];
        tasks.push(
          toTask(
            {
              key: `mock-w${w}`, phase: 3, priority: "standard", title: `Week ${w} mock interview (${type})`,
              topic: "Interview practice", difficulty: "Medium", durationMin: 30,
              objective: "Build fluency through regular interview repetitions",
              description: "A short written mock interview with a rubric-based scorecard.",
              notes: ["Answer as you would aloud", "Compare your scorecard with the previous one", "Act on one recommendation before the next mock"],
              interviewType: type,
            },
            w
          )
        );
      }
    }
  }

  assignDueDates(tasks, startDate, weeks);

  if (prev) {
    const prevByKey = new Map(prev.tasks.map((t) => [t.key, t]));
    for (const t of tasks) {
      const p = prevByKey.get(t.key);
      if (p) {
        t.id = p.id;
        t.status = p.status;
        t.score = p.score;
        t.startedAt = p.startedAt;
        t.completedAt = p.completedAt;
        t.seeded = p.seeded;
        prevByKey.delete(t.key);
      }
    }
    // Keep finished work that is no longer part of the plan so history is not lost.
    for (const p of prevByKey.values()) {
      if (p.status === "completed") tasks.push({ ...p, week: clamp(p.week, 1, weeks) });
    }
  }

  tasks.sort((a, b) => a.week - b.week || a.dueDate.localeCompare(b.dueDate));

  return {
    id: prev?.id ?? uid("roadmap"),
    roleId,
    weeks,
    minutesPerDay,
    startDate,
    generatedAt: new Date().toISOString(),
    tasks,
    droppedCount: templates.length - selected.length,
  };
}

function assignDueDates(tasks: RoadmapTask[], startDate: string, weeks: number) {
  for (let w = 1; w <= weeks; w++) {
    const inWeek = tasks.filter((t) => t.week === w);
    const weekTotal = inWeek.reduce((s, t) => s + t.durationMin, 0) || 1;
    let c = 0;
    for (const t of inWeek) {
      c += t.durationMin;
      const dayOffset = clamp(Math.ceil((c / weekTotal) * STUDY_DAYS_PER_WEEK) - 1, 0, STUDY_DAYS_PER_WEEK - 1);
      t.dueDate = addDays(startDate, (w - 1) * 7 + dayOffset);
    }
  }
}

export function roadmapEndDate(r: Roadmap): string {
  return addDays(r.startDate, r.weeks * 7 - 1);
}

export function currentWeek(r: Roadmap, today: string = dayKey()): number {
  return clamp(Math.floor(diffDays(r.startDate, today) / 7) + 1, 1, r.weeks);
}

export function isOverdue(t: RoadmapTask, today: string = dayKey()): boolean {
  return t.status !== "completed" && t.dueDate < today;
}

/** Moves overdue tasks forward from today, filling each day up to the daily time budget. */
export function rescheduleOverdue(r: Roadmap, today: string = dayKey()): Roadmap {
  const end = roadmapEndDate(r);
  const overdue = r.tasks.filter((t) => isOverdue(t, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  let day = today;
  let load = 0;
  const moved = new Map<string, string>();
  for (const t of overdue) {
    if (load > 0 && load + t.durationMin > r.minutesPerDay) {
      day = addDays(day, 1);
      load = 0;
    }
    load += t.durationMin;
    moved.set(t.id, day > end ? end : day);
  }
  const tasks = r.tasks
    .map((t) => {
      const due = moved.get(t.id);
      if (!due) return t;
      return { ...t, dueDate: due, week: clamp(Math.floor(diffDays(r.startDate, due) / 7) + 1, 1, r.weeks) };
    })
    .sort((a, b) => a.week - b.week || a.dueDate.localeCompare(b.dueDate));
  return { ...r, tasks };
}

export function plannedMinutes(r: Roadmap): number {
  return r.tasks.reduce((s, t) => s + t.durationMin, 0);
}

export function budgetMinutes(weeks: number, minutesPerDay: number): number {
  return weeks * STUDY_DAYS_PER_WEEK * minutesPerDay;
}
