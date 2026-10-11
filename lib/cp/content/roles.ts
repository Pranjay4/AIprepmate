import type { RoleId, InterviewType, Difficulty } from "../types";

export interface RoleDef {
  id: RoleId;
  name: string;
  short: string;
  blurb: string;
  topics: string[];
  /** Roles with a full module library and question bank. */
  depth: "full" | "starter";
}

export const COMMON_TOPICS = ["Behavioural", "HR & Resume"];

export const ROLES: RoleDef[] = [
  {
    id: "ba",
    name: "Business Analyst",
    short: "Business Analyst",
    blurb: "SQL, Excel, statistics, metrics and analytical cases.",
    topics: ["SQL", "Excel", "Statistics", "Business Metrics", "Data Interpretation", "Case Interviews"],
    depth: "full",
  },
  {
    id: "pm",
    name: "Product Manager / Product Analyst",
    short: "Product",
    blurb: "Product sense, prioritisation, metrics, strategy and execution.",
    topics: ["Product Sense", "Prioritisation", "Metrics", "Product Strategy", "User Research", "Product Execution"],
    depth: "full",
  },
  {
    id: "marketing",
    name: "Marketing / Brand Management",
    short: "Marketing",
    blurb: "Segmentation, brand strategy, digital metrics and consumer insight.",
    topics: ["Marketing Fundamentals", "Brand Strategy", "Digital Marketing", "Consumer Insights"],
    depth: "starter",
  },
  {
    id: "finance",
    name: "Finance Analyst",
    short: "Finance",
    blurb: "Accounting, ratios, valuation and markets awareness.",
    topics: ["Accounting", "Financial Ratios", "Valuation", "Markets"],
    depth: "starter",
  },
  {
    id: "consulting",
    name: "Consulting",
    short: "Consulting",
    blurb: "Case frameworks, market sizing, profitability and structured communication.",
    topics: ["Case Frameworks", "Market Sizing", "Profitability", "Structured Communication"],
    depth: "starter",
  },
  {
    id: "software",
    name: "Software / Technical Roles",
    short: "Software",
    blurb: "Data structures, algorithms, DBMS, OOP and system design basics.",
    topics: ["Data Structures", "Algorithms", "DBMS & SQL", "OOP", "System Design Basics"],
    depth: "starter",
  },
];

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, RoleDef>;

export function roleName(id: RoleId | null | undefined): string {
  return id ? ROLE_MAP[id].name : "No role selected";
}

export function topicsForRole(id: RoleId): string[] {
  return [...ROLE_MAP[id].topics, ...COMMON_TOPICS];
}

export const INTERVIEW_TYPES: { id: InterviewType; label: string; desc: string }[] = [
  { id: "hr", label: "HR", desc: "Motivation, fit and resume walkthrough." },
  { id: "behavioural", label: "Behavioural", desc: "Past situations answered with a clear structure." },
  { id: "technical", label: "Technical", desc: "Core concepts for your target role." },
  { id: "case", label: "Case", desc: "Structured problem solving out loud." },
  { id: "role", label: "Role-specific", desc: "Judgement questions typical for the role." },
];

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
export const TIMELINES = [2, 4, 8, 12] as const;
export const DAILY_MINUTES = [30, 45, 60, 90, 120, 180];
