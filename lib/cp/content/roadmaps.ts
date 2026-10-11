import type { Difficulty, InterviewType, PracticeRef, RoleId } from "../types";
import { MODULE_MAP } from "./modules";

export type Priority = "core" | "standard" | "stretch";

export interface TaskTemplate {
  key: string;
  phase: 1 | 2 | 3 | 4;
  priority: Priority;
  title: string;
  description: string;
  topic: string;
  difficulty: Difficulty;
  durationMin: number;
  objective: string;
  notes: string[];
  moduleId?: string;
  practice?: PracticeRef;
  interviewType?: InterviewType;
}

export const PHASES: Record<number, string> = {
  1: "Foundations",
  2: "Core skills",
  3: "Application",
  4: "Interview readiness",
};

/** A task backed by a learning module: text is derived from the module itself. */
function mod(key: string, phase: TaskTemplate["phase"], priority: Priority, moduleId: string, practiceCount = 5): TaskTemplate {
  const m = MODULE_MAP[moduleId];
  return {
    key, phase, priority, moduleId,
    title: m.title,
    description: m.description,
    topic: m.topic,
    difficulty: m.difficulty,
    durationMin: m.durationMin,
    objective: m.objectives[0],
    notes: m.objectives.slice(1),
    practice: { topics: [m.topic], count: practiceCount },
  };
}

function prac(
  key: string, phase: TaskTemplate["phase"], priority: Priority, title: string, topic: string, difficulty: Difficulty,
  durationMin: number, objective: string, description: string, notes: string[], practice: PracticeRef
): TaskTemplate {
  return { key, phase, priority, title, topic, difficulty, durationMin, objective, description, notes, practice };
}

/** Self-study task with an embedded lesson (used where no full module exists yet). */
function self(
  key: string, phase: TaskTemplate["phase"], priority: Priority, title: string, topic: string, difficulty: Difficulty,
  durationMin: number, objective: string, description: string, notes: string[], practice?: PracticeRef
): TaskTemplate {
  return { key, phase, priority, title, topic, difficulty, durationMin, objective, description, notes, practice };
}

const IV_TEXT: Record<InterviewType, { title: string; objective: string; notes: string[] }> = {
  hr: {
    title: "Mock interview: HR round",
    objective: "Answer motivation and resume questions with a clear thread and specifics",
    notes: ["Use present, relevant past, then why this role", "Name specifics rather than adjectives", "Keep each answer under two minutes"],
  },
  behavioural: {
    title: "Mock interview: behavioural round",
    objective: "Tell structured stories with your own actions and a measurable result",
    notes: ["Use Situation, Task, Action, Result", "Say 'I' for your contribution", "Finish with the result and what you learned"],
  },
  technical: {
    title: "Mock interview: technical round",
    objective: "Explain core concepts for your role accurately and with examples",
    notes: ["Define the concept first, then give an example", "State assumptions out loud", "Admit what you do not know and reason toward it"],
  },
  case: {
    title: "Mock interview: case round",
    objective: "Structure an open business problem and reach a reasoned recommendation",
    notes: ["Clarify the objective before structuring", "Lay out your structure, then drill into one branch", "Close with an answer, evidence, a risk and a next step"],
  },
  role: {
    title: "Mock interview: role-specific round",
    objective: "Show the judgement expected in day-to-day situations for your target role",
    notes: ["Start from the goal and the stakeholder", "Lay out options and trade-offs", "Make a clear choice and explain it"],
  },
};

function iv(key: string, phase: TaskTemplate["phase"], priority: Priority, type: InterviewType, topic: string): TaskTemplate {
  const t = IV_TEXT[type];
  return {
    key, phase, priority, interviewType: type, topic,
    title: t.title,
    description: "Answer a short sequence of written interview questions and receive a rubric-based scorecard.",
    difficulty: "Medium",
    durationMin: 30,
    objective: t.objective,
    notes: t.notes,
  };
}

/** Final phase shared by every role. */
function closing(p: string, technicalTopic: string): TaskTemplate[] {
  return [
    mod(`${p}-resume`, 4, "core", "common-resume", 3),
    mod(`${p}-star`, 4, "standard", "common-star", 3),
    iv(`${p}-mock-hr`, 4, "core", "hr", "HR & Resume"),
    iv(`${p}-mock-beh`, 4, "stretch", "behavioural", "Behavioural"),
    prac(`${p}-revision`, 4, "core", "Revision of weak topics", technicalTopic, "Medium", 35,
      "Close the gaps your practice history has revealed",
      "A mixed practice set drawn from the topics where your accuracy is lowest. If you have no practice history yet, it samples every topic for your role.",
      ["Review the explanation for every question you miss", "Re-read the related lesson before retrying", "Save questions you want to revisit"],
      { topics: [], count: 10 }),
    prac(`${p}-final`, 4, "core", "Final readiness assessment", technicalTopic, "Hard", 30,
      "Check your overall readiness under timed conditions",
      "A timed, mixed assessment across all topics for your role. Use the result to decide what to revise in your final days.",
      ["Treat it like the real test: no notes", "Skip and return rather than stall on one question", "Review every explanation afterwards"],
      { topics: ["*"], count: 12, timed: true }),
  ];
}

export const ROADMAP_TEMPLATES: Record<RoleId, TaskTemplate[]> = {
  ba: [
    mod("ba-sql-1", 1, "core", "ba-sql-1"),
    prac("ba-sql-drill-1", 1, "core", "SQL practice: SELECT, WHERE and GROUP BY", "SQL", "Easy", 40,
      "Write filtering and aggregation queries without looking at notes",
      "Hands-on queries against the practice dataset. Your SQL is executed in the browser and compared with the expected result.",
      ["Say the grain of the answer before writing: one row per what?", "Filter rows in WHERE, groups in HAVING", "Check your result against the table preview"],
      { topics: ["SQL"], count: 6, types: ["mcq", "sql"] }),
    mod("ba-metrics", 1, "core", "ba-metrics"),
    prac("ba-metrics-drill", 1, "standard", "Daily practice: business metrics", "Business Metrics", "Easy", 20,
      "Calculate and interpret common business metrics quickly",
      "A short set on conversion, AOV, CAC, LTV and metric decomposition.",
      ["Write the formula before the numbers", "State the numerator, denominator and time window", "Ask which driver moved"],
      { topics: ["Business Metrics"], count: 5 }),
    mod("ba-sql-2", 2, "core", "ba-sql-2"),
    prac("ba-sql-drill-2", 2, "standard", "SQL practice: JOINs and multi-step queries", "SQL", "Medium", 40,
      "Combine tables and aggregate without double counting",
      "Join and aggregation queries on customers, orders and employees.",
      ["Decide INNER or LEFT from the wording of the question", "Use COUNT(column) to show zero for unmatched rows", "Break the question into join, filter, group"],
      { topics: ["SQL", "DBMS & SQL"], count: 5, types: ["sql"] }),
    mod("ba-excel", 2, "core", "ba-excel"),
    mod("ba-stats", 2, "core", "ba-stats"),
    mod("ba-data", 2, "standard", "ba-data"),
    prac("ba-analytical", 2, "standard", "Case-based analytical questions", "Data Interpretation", "Medium", 30,
      "Apply statistics and data interpretation to short business scenarios",
      "A mixed set covering growth, share, percentage points, averages and experiment logic.",
      ["Check the base before comparing percentages", "Look for a mix shift behind a changing average", "State the insight, evidence and implication"],
      { topics: ["Data Interpretation", "Statistics"], count: 8 }),
    mod("ba-case", 3, "core", "ba-case"),
    prac("ba-kpi", 3, "standard", "KPI selection and interpretation", "Business Metrics", "Medium", 25,
      "Choose metrics that match a goal and explain what a change means",
      "Written and multiple-choice questions on choosing, decomposing and questioning KPIs.",
      ["Tie each KPI to a decision", "Pair a primary metric with a guardrail", "Explain movement using drivers and segments"],
      { topics: ["Business Metrics", "Metrics"], count: 5 }),
    prac("ba-case-ex", 3, "core", "Product and business case exercises", "Case Interviews", "Hard", 40,
      "Write a structured response to an open business case",
      "Written case questions. Your answer is checked against key points, then shown beside a model answer.",
      ["Clarify, structure, analyse, recommend", "Segment the driver that moved", "Close with an answer, a risk and a next step"],
      { topics: ["Case Interviews"], count: 3, types: ["case", "interview"] }),
    iv("ba-mock-tech", 3, "core", "technical", "SQL"),
    iv("ba-mock-case", 3, "stretch", "case", "Case Interviews"),
    ...closing("ba", "Case Interviews"),
  ],
  pm: [
    mod("pm-sense", 1, "core", "pm-sense"),
    mod("pm-research", 1, "core", "pm-research"),
    prac("pm-sense-drill", 1, "standard", "Practice: product sense basics", "Product Sense", "Easy", 20,
      "Apply the goal-user-pain-solution sequence to short questions",
      "A short set on clarifying goals, segmenting users and choosing guardrails.",
      ["Clarify before proposing", "Pick one segment and say why", "Name a guardrail for every solution"],
      { topics: ["Product Sense", "User Research"], count: 6 }),
    mod("pm-metrics", 2, "core", "pm-metrics"),
    mod("ba-metrics", 2, "standard", "ba-metrics"),
    mod("pm-prio", 2, "core", "pm-prio"),
    prac("pm-metrics-drill", 2, "standard", "Practice: metrics and prioritisation", "Metrics", "Medium", 30,
      "Define metrics for a feature and rank competing initiatives",
      "A mixed set on North Star metrics, funnels, RICE and trade-offs.",
      ["State what the metric is a proxy for", "Check tracking before diagnosing a drop", "Show the framework, then the judgement"],
      { topics: ["Metrics", "Prioritisation"], count: 8 }),
    mod("pm-strategy", 3, "core", "pm-strategy"),
    mod("pm-exec", 3, "core", "pm-exec"),
    prac("pm-case-ex", 3, "core", "Product case exercises", "Product Sense", "Hard", 40,
      "Write a complete answer to a product design or diagnosis case",
      "Written product cases checked against key points and shown beside a model answer.",
      ["Follow goal → user → pain points → solutions → metric", "Offer solutions that differ in kind", "State the trade-off you are accepting"],
      { topics: ["Product Sense", "Metrics", "Product Strategy"], count: 3, types: ["case", "short"] }),
    prac("pm-exec-drill", 3, "standard", "Practice: strategy and execution", "Product Execution", "Medium", 25,
      "Reason about advantage, MVP scope and experiment results",
      "Questions on network effects, switching costs, MVPs, rollouts and A/B tests.",
      ["Ask what the riskiest assumption is", "Define success and rollback criteria before launch", "Do not stop a test early"],
      { topics: ["Product Strategy", "Product Execution"], count: 8 }),
    iv("pm-mock-case", 3, "core", "case", "Product Sense"),
    iv("pm-mock-tech", 3, "stretch", "technical", "Metrics"),
    iv("pm-mock-role", 4, "standard", "role", "Product Execution"),
    ...closing("pm", "Product Sense"),
  ],
  marketing: [
    mod("mk-fund", 1, "core", "mkt-fund"),
    self("mk-consumer", 1, "core", "Consumer behaviour and insights", "Consumer Insights", "Easy", 30,
      "Distinguish an observation from an insight and use it to shape a message",
      "Learn how needs, motivations and context drive purchase decisions.",
      ["An observation says what people do; an insight explains why and suggests an action", "The decision journey: need, search, evaluation, purchase, post-purchase", "Look for tensions — what people want versus what stops them", "Test an insight by asking: would the customer say 'yes, that is exactly it'?"],
      { topics: ["Consumer Insights", "User Research"], count: 5 }),
    mod("mk-research", 2, "standard", "pm-research"),
    self("mk-brand", 2, "core", "Brand strategy essentials", "Brand Strategy", "Medium", 35,
      "Explain brand equity, positioning consistency and extension decisions",
      "Core brand concepts that come up in brand-management interviews.",
      ["Brand equity is the extra value a name adds: awareness, associations, perceived quality, loyalty", "A line extension adds a variant in the same category; a brand extension enters a new category", "Extensions work when the brand's core association transfers to the new category", "Every element of the mix should reinforce the same positioning"],
      { topics: ["Brand Strategy", "Marketing Fundamentals"], count: 5 }),
    self("mk-digital", 2, "core", "Digital marketing metrics", "Digital Marketing", "Easy", 30,
      "Compute and interpret CTR, conversion rate, CPA and ROAS",
      "Read a campaign report and say where the funnel is leaking.",
      ["CTR = clicks / impressions; conversion rate = conversions / clicks", "CPA = spend / conversions; ROAS = attributed revenue / spend", "High CTR with low conversion points to the landing page or offer", "Compare channels on cost per outcome, not on clicks"],
      { topics: ["Digital Marketing", "Business Metrics"], count: 6 }),
    prac("mk-case-ex", 3, "core", "Launch-plan case exercise", "Brand Strategy", "Hard", 40,
      "Write a launch plan covering STP, the 4Ps and measurement",
      "A written case checked against key points and shown beside a model answer.",
      ["Choose one target segment and justify it", "Keep the 4Ps consistent with the positioning", "Say how you would measure success in the first month"],
      { topics: ["Brand Strategy", "Marketing Fundamentals"], count: 2, types: ["case"] }),
    iv("mk-mock-tech", 3, "core", "technical", "Marketing Fundamentals"),
    iv("mk-mock-case", 3, "standard", "case", "Brand Strategy"),
    iv("mk-mock-role", 4, "stretch", "role", "Brand Strategy"),
    ...closing("mk", "Marketing Fundamentals"),
  ],
  finance: [
    mod("fn-fund", 1, "core", "fin-fund"),
    self("fn-ratios", 1, "core", "Financial ratio analysis", "Financial Ratios", "Medium", 35,
      "Compute and interpret profitability, liquidity and leverage ratios",
      "Practise reading a company's health from a handful of ratios.",
      ["Profitability: gross margin, net margin, ROE", "Liquidity: current ratio and quick ratio", "Leverage: debt-to-equity and interest coverage", "Always compare with the company's history and with industry peers"],
      { topics: ["Financial Ratios", "Accounting"], count: 5 }),
    mod("fn-excel", 2, "standard", "ba-excel"),
    self("fn-valuation", 2, "core", "Valuation basics: DCF and multiples", "Valuation", "Hard", 45,
      "Explain how a DCF and a multiples valuation work and when to use each",
      "The two valuation approaches every finance interview touches.",
      ["DCF: forecast free cash flows, discount at the cost of capital, add a terminal value", "Multiples: apply a peer ratio such as P/E or EV/EBITDA to the company's own metric", "DCF is sensitive to growth and discount-rate assumptions — show a range", "Use multiples for a market cross-check and DCF for intrinsic value"],
      { topics: ["Valuation"], count: 4 }),
    self("fn-markets", 2, "standard", "Markets awareness", "Markets", "Medium", 30,
      "Discuss interest rates, bonds and equity markets coherently",
      "Build the habit of following markets so you can hold a view in an interview.",
      ["Bond prices fall when interest rates rise", "Central-bank policy rates influence borrowing costs across the economy", "Follow one sector and two companies closely enough to hold a view", "Structure a view as thesis, evidence, risk"],
      { topics: ["Markets", "Valuation"], count: 4 }),
    prac("fn-drill", 3, "core", "Practice: accounting and valuation", "Accounting", "Medium", 30,
      "Answer core technical finance questions accurately",
      "A mixed set including the classic depreciation walkthrough.",
      ["Go statement by statement", "Check that the balance sheet balances", "Show the formula before the number"],
      { topics: ["Accounting", "Valuation", "Financial Ratios", "Markets"], count: 9 }),
    iv("fn-mock-tech", 3, "core", "technical", "Accounting"),
    iv("fn-mock-case", 3, "standard", "case", "Valuation"),
    iv("fn-mock-role", 4, "stretch", "role", "Markets"),
    ...closing("fn", "Accounting"),
  ],
  consulting: [
    mod("cs-fund", 1, "core", "con-fund"),
    mod("cs-data", 1, "core", "ba-data"),
    self("cs-sizing", 2, "core", "Market sizing drills", "Market Sizing", "Medium", 35,
      "Produce a defensible estimate in five minutes with explicit assumptions",
      "Practise top-down estimates out loud until the structure is automatic.",
      ["Start from a population and narrow it with clear filters", "Segment when groups behave differently", "Round numbers to keep arithmetic clean", "Sanity-check the result from a second angle"],
      { topics: ["Market Sizing", "Data Interpretation"], count: 5 }),
    mod("cs-case", 2, "core", "ba-case"),
    self("cs-comm", 2, "standard", "Structured communication", "Structured Communication", "Easy", 25,
      "Deliver answers top-down with clear signposting",
      "Practise the answer-first style consultants are assessed on.",
      ["Lead with the answer, then give two or three supporting points", "Signpost: 'I will cover three areas...'", "State the so-what of every number", "Summarise before moving on"],
      { topics: ["Structured Communication", "Case Frameworks"], count: 4 }),
    prac("cs-profit", 3, "core", "Profitability case exercise", "Profitability", "Hard", 40,
      "Structure and solve a profitability case in writing",
      "A written case checked against key points and shown beside a model answer.",
      ["Split profit into revenue and cost first", "Drill only into the branch that moved", "Finish with a recommendation, risk and next step"],
      { topics: ["Profitability", "Case Interviews"], count: 3, types: ["case", "mcq"] }),
    iv("cs-mock-case", 3, "core", "case", "Case Frameworks"),
    iv("cs-mock-tech", 3, "standard", "technical", "Market Sizing"),
    iv("cs-mock-role", 4, "stretch", "role", "Structured Communication"),
    ...closing("cs", "Case Frameworks"),
  ],
  software: [
    mod("sw-fund", 1, "core", "sw-fund"),
    self("sw-algo", 1, "core", "Sorting, searching and complexity", "Algorithms", "Medium", 45,
      "Analyse the complexity of an approach and improve on brute force",
      "Revise the standard algorithms and practise explaining complexity.",
      ["Binary search needs sorted input and runs in O(log n)", "Merge sort is O(n log n) in every case; quicksort is O(n log n) on average", "Two-pointer and hash-set techniques often turn O(n^2) into O(n)", "State brute force first, then the improvement"],
      { topics: ["Algorithms", "Data Structures"], count: 5 }),
    mod("sw-sql", 2, "core", "ba-sql-1"),
    prac("sw-sql-drill", 2, "standard", "SQL practice on the employees dataset", "DBMS & SQL", "Medium", 30,
      "Write grouping and self-join queries",
      "Your SQL is executed in the browser and compared with the expected result.",
      ["One row per what?", "A self join uses the same table twice with aliases", "Filter groups with HAVING"],
      { topics: ["DBMS & SQL", "SQL"], count: 5, types: ["sql", "mcq"] }),
    self("sw-oop", 2, "core", "OOP and DBMS concepts", "OOP", "Easy", 35,
      "Explain the four OOP pillars and core DBMS ideas with examples",
      "The theory questions that appear in almost every technical round.",
      ["Encapsulation, abstraction, inheritance, polymorphism — have one example of each", "A primary key is unique and not NULL; a foreign key references another table's key", "Normalisation removes redundancy; indexes speed reads at the cost of writes", "ACID: atomicity, consistency, isolation, durability"],
      { topics: ["OOP", "DBMS & SQL"], count: 4 }),
    self("sw-design", 3, "standard", "System design basics", "System Design Basics", "Medium", 40,
      "Sketch a simple scalable service and explain each component's role",
      "Enough system design to handle entry-level questions.",
      ["Clarify requirements and scale before drawing boxes", "Load balancers spread traffic; caches speed repeated reads", "Choose the data model from the access pattern", "Name the bottleneck and how you would relieve it"],
      { topics: ["System Design Basics"], count: 3 }),
    prac("sw-drill", 3, "core", "Mixed technical practice", "Data Structures", "Medium", 30,
      "Answer core CS questions quickly and accurately",
      "A mixed set across data structures, algorithms, OOP, DBMS and system design.",
      ["Eliminate options by complexity", "Explain why the wrong options are wrong", "Review every explanation"],
      { topics: ["Data Structures", "Algorithms", "OOP", "DBMS & SQL", "System Design Basics"], count: 10 }),
    iv("sw-mock-tech", 3, "core", "technical", "Data Structures"),
    iv("sw-mock-role", 4, "standard", "role", "Algorithms"),
    iv("sw-mock-case", 4, "stretch", "case", "System Design Basics"),
    ...closing("sw", "Data Structures"),
  ],
};
