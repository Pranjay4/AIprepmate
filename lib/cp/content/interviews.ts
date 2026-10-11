import type { InterviewQuestion, InterviewType, RoleId } from "../types";

const q = (
  id: string, role: RoleId | "all", type: InterviewType, prompt: string,
  keywords: string[], followUp: string, tip: string
): InterviewQuestion => ({ id, role, type, prompt, keywords, followUp, tip });

// keywords: concepts a relevant answer usually touches. Used by the rubric's relevance check.
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // HR — all roles
  q("iv-hr-1", "all", "hr", "Tell me about yourself.", ["study", "experience", "project", "internship", "role", "skill", "interest"],
    "Which of those experiences prepared you most for this role, and how?", "Use present, relevant past, then why this role — about 90 seconds."),
  q("iv-hr-2", "all", "hr", "Why do you want this role, and why should we hire you?", ["role", "skill", "experience", "contribute", "interest", "company", "strength"],
    "What would you want to have achieved in your first six months?", "Link evidence from your past to what the role needs."),
  q("iv-hr-3", "all", "hr", "What is your biggest weakness, and what are you doing about it?", ["weakness", "improve", "example", "learn", "feedback", "working on"],
    "Give a recent example where that weakness showed up. What did you do differently?", "Choose a real weakness, give an example, and describe a concrete improvement."),
  q("iv-hr-4", "all", "hr", "Where do you see yourself in five years?", ["goal", "learn", "grow", "skill", "role", "responsib", "career"],
    "What skills do you need to build to get there?", "Show direction and realism; tie it to the role's path."),
  q("iv-hr-5", "all", "hr", "Walk me through one item on your resume you are most proud of.", ["project", "result", "responsib", "team", "learn", "outcome", "role"],
    "What would you do differently if you did it again?", "Pick one item and cover goal, your actions, result and lesson."),

  // Behavioural — all roles
  q("iv-bh-1", "all", "behavioural", "Tell me about a time you led a team through a difficult situation.", ["team", "lead", "decision", "result", "challenge", "responsib", "outcome"],
    "How did you handle a team member who disagreed with your approach?", "STAR: keep the situation short and the actions detailed."),
  q("iv-bh-2", "all", "behavioural", "Describe a time you failed. What did you learn?", ["fail", "mistake", "learn", "result", "responsib", "change", "next time"],
    "How have you applied that lesson since?", "Own your part, then show the change you made."),
  q("iv-bh-3", "all", "behavioural", "Tell me about a time you disagreed with a teammate or supervisor.", ["disagree", "listen", "perspective", "data", "resolve", "outcome", "team"],
    "Looking back, was your position right? What would you change?", "Show that you listened, used evidence and protected the relationship."),
  q("iv-bh-4", "all", "behavioural", "Describe a time you worked under a tight deadline.", ["deadline", "priorit", "plan", "time", "deliver", "result", "pressure"],
    "What did you deliberately leave out, and how did you decide?", "Show prioritisation, not just long hours."),
  q("iv-bh-5", "all", "behavioural", "Tell me about a time you persuaded someone without having authority over them.", ["persuade", "convince", "data", "listen", "benefit", "stakeholder", "result"],
    "What objection was hardest to overcome and how did you address it?", "Explain what the other person cared about and how you addressed it."),

  // Business Analyst
  q("iv-ba-t1", "ba", "technical", "Explain the difference between INNER JOIN and LEFT JOIN, with an example of when you would use each.", ["inner", "left", "match", "null", "rows", "table", "example"],
    "How would the row count differ between the two in your example?", "Define each, then give a concrete case such as customers with no orders."),
  q("iv-ba-t2", "ba", "technical", "You are given a sales dataset with missing values and duplicates. How do you clean it before analysis?", ["missing", "duplicate", "null", "outlier", "validate", "impute", "check"],
    "When would you remove rows with missing values rather than fill them?", "Describe checks in order and explain the reasoning behind each decision."),
  q("iv-ba-t3", "ba", "technical", "How would you decide whether to report the mean or the median for a metric?", ["mean", "median", "skew", "outlier", "distribution", "typical"],
    "Give an example where reporting the mean would mislead a manager.", "Tie the choice to the shape of the distribution and the decision being made."),
  q("iv-ba-c1", "ba", "case", "An e-commerce company's revenue fell 10% last month. How would you find out why?", ["revenue", "visitors", "conversion", "order value", "segment", "funnel", "hypothes", "channel"],
    "Suppose conversion fell only on mobile. What would you check next?", "Decompose revenue, segment the driver that moved, then check internal and external causes."),
  q("iv-ba-c2", "ba", "case", "A subscription app wants to reduce churn. What analysis would you do and what might you recommend?", ["churn", "retention", "cohort", "segment", "usage", "reason", "experiment", "recommend"],
    "How would you measure whether your recommendation worked?", "Define churn, segment it, find behaviours that predict it, then propose a test."),
  q("iv-ba-c3", "ba", "case", "A retailer wants to know whether a recent discount campaign was worth it. How would you evaluate it?", ["incremental", "baseline", "control", "margin", "revenue", "cost", "compare", "cannibal"],
    "How would you estimate what sales would have been without the discount?", "Compare against a baseline or control and look at margin, not just revenue."),
  q("iv-ba-r1", "ba", "role", "A stakeholder asks for a dashboard with 30 metrics. How do you respond?", ["decision", "priorit", "stakeholder", "question", "kpi", "goal", "simplif"],
    "How would you handle it if they insisted on all 30?", "Start from the decisions the dashboard must support."),
  q("iv-ba-r2", "ba", "role", "Your analysis contradicts what a senior manager believes. How do you present it?", ["evidence", "data", "assumption", "validate", "communicat", "respect", "recommend"],
    "What would you do if they dismissed the finding?", "Check your work, lead with evidence, and frame it around the shared goal."),
  q("iv-ba-r3", "ba", "role", "Which KPIs would you track for a food-delivery business, and why?", ["orders", "retention", "delivery time", "aov", "order value", "conversion", "cost", "customer"],
    "Which single KPI would you choose if you could track only one?", "Group KPIs by customer, operations and economics; explain each choice."),

  // Product
  q("iv-pm-t1", "pm", "technical", "How would you define success metrics for a new 'save for later' feature in a shopping app?", ["metric", "adoption", "conversion", "retention", "guardrail", "usage", "purchase"],
    "What guardrail metric would you watch, and why?", "Name a primary metric, a business metric and a guardrail."),
  q("iv-pm-t2", "pm", "technical", "Explain how you would design and read an A/B test for a new onboarding flow.", ["hypothes", "control", "random", "metric", "sample", "significan", "duration", "guardrail"],
    "The result is positive but not statistically significant. What do you do?", "Cover hypothesis, metric, sample and duration before discussing the result."),
  q("iv-pm-t3", "pm", "technical", "How do you prioritise a backlog of ten feature requests with limited engineering time?", ["impact", "effort", "reach", "confidence", "rice", "strategy", "stakeholder", "trade-off"],
    "Which request would you say no to, and how would you communicate it?", "Show a framework, then the judgement beyond it."),
  q("iv-pm-c1", "pm", "case", "Design a product to help college students manage their monthly budget.", ["user", "segment", "pain", "problem", "solution", "priorit", "metric", "goal"],
    "Which one feature would you ship first, and why that one?", "Goal → users → pain points → solutions → prioritise → metrics."),
  q("iv-pm-c2", "pm", "case", "Daily active users of a messaging app dropped 8% this week. How would you investigate?", ["data", "tracking", "segment", "platform", "release", "funnel", "external", "hypothes"],
    "Suppose only Android users on the latest version are affected. What next?", "Verify, segment, check what changed, then form and test a hypothesis."),
  q("iv-pm-c3", "pm", "case", "Should a ride-hailing app launch a bike-rental service? How would you decide?", ["market", "user", "compet", "advantage", "cost", "risk", "pilot", "strategy"],
    "What would a successful pilot look like in numbers?", "Assess market attractiveness, ability to win, economics and risk; recommend a test."),
  q("iv-pm-r1", "pm", "role", "Engineering says a feature will take three times longer than planned. What do you do?", ["scope", "priorit", "trade-off", "stakeholder", "communicat", "mvp", "timeline", "understand"],
    "How do you tell the stakeholder who was promised the original date?", "Understand why, re-scope around the core value, and communicate early."),
  q("iv-pm-r2", "pm", "role", "Tell me about a product you admire. What makes it good, and what would you change?", ["user", "problem", "experience", "design", "improve", "metric", "trade-off"],
    "How would you measure whether your change worked?", "Anchor on the user problem it solves, then one reasoned improvement."),
  q("iv-pm-r3", "pm", "role", "Sales wants a custom feature for one large client. Design says it hurts the product. How do you handle it?", ["stakeholder", "data", "user", "revenue", "trade-off", "align", "option", "goal"],
    "What data would change your mind?", "Find the underlying need, lay out options, and decide against the product goal."),

  // Marketing
  q("iv-mk-t1", "marketing", "technical", "Explain segmentation, targeting and positioning using a brand you know.", ["segment", "target", "position", "customer", "benefit", "brand"],
    "Which segment is that brand deliberately not serving?", "Define each term briefly, then apply all three to one brand."),
  q("iv-mk-t2", "marketing", "technical", "A campaign has a high click-through rate but low conversions. How would you diagnose it?", ["landing", "conversion", "audience", "offer", "funnel", "message", "target"],
    "What single test would you run first?", "Follow the user after the click: audience, promise, landing page, offer."),
  q("iv-mk-c1", "marketing", "case", "How would you launch a new healthy snack brand for college students on a small budget?", ["target", "position", "channel", "price", "sampling", "social", "budget", "metric"],
    "How would you know after one month whether the launch is working?", "Target → positioning → 4Ps → measurement."),
  q("iv-mk-c2", "marketing", "case", "Sales of an established soap brand are declining. How would you find the cause?", ["sales", "distribution", "price", "competit", "consumer", "segment", "awareness", "volume"],
    "If the decline is only in urban markets, what would you look at next?", "Split volume and price, then check distribution, competition and consumer shifts."),
  q("iv-mk-r1", "marketing", "role", "Pick a brand whose advertising you find effective. Why does it work?", ["brand", "target", "message", "emotion", "insight", "consistent", "position"],
    "What would you change to reach a younger audience?", "Name the target, the insight and why the message fits the positioning."),
  q("iv-mk-r2", "marketing", "role", "How would you measure the success of a brand-awareness campaign?", ["awareness", "reach", "recall", "survey", "search", "metric", "baseline"],
    "How would you separate the campaign's effect from seasonal trends?", "Set a baseline and use both survey and behavioural measures."),

  // Finance
  q("iv-fn-t1", "finance", "technical", "Walk me through the three financial statements and how they connect.", ["income", "balance", "cash flow", "net profit", "retained", "assets", "liabilit"],
    "How does a 10 increase in depreciation flow through them?", "Describe each briefly, then the links via net profit and cash."),
  q("iv-fn-t2", "finance", "technical", "How would you value a company?", ["dcf", "cash flow", "discount", "multiple", "comparable", "p/e", "terminal"],
    "When would you prefer multiples over a DCF?", "Name the main methods and when each is appropriate."),
  q("iv-fn-t3", "finance", "technical", "What is working capital, and why does it matter?", ["current assets", "current liabilit", "cash", "receivable", "inventory", "payable", "liquidity"],
    "How can a profitable company still run out of cash?", "Define it, then link it to liquidity and the cash cycle."),
  q("iv-fn-c1", "finance", "case", "A company is deciding whether to invest in a new plant. How would you evaluate the decision?", ["npv", "cash flow", "discount", "irr", "payback", "risk", "cost", "sensitivity"],
    "Which assumption would you stress-test first?", "Forecast cash flows, discount them, and test key assumptions."),
  q("iv-fn-r1", "finance", "role", "Tell me about a company or sector you follow and your view on it.", ["company", "sector", "revenue", "growth", "margin", "risk", "valuation", "view"],
    "What would make you change that view?", "State a view, two or three supporting facts and the main risk."),
  q("iv-fn-r2", "finance", "role", "Why finance, and why this particular area of it?", ["interest", "experience", "skill", "analysis", "market", "career", "learn"],
    "What have you done outside coursework to explore that interest?", "Show evidence of interest through actions, not adjectives."),

  // Consulting
  q("iv-cs-t1", "consulting", "technical", "Estimate the number of cups of tea consumed on your campus in a day.", ["assum", "population", "students", "percent", "per day", "segment", "estimate"],
    "How would you sanity-check that number?", "State assumptions, segment if needed, calculate, then sanity-check."),
  q("iv-cs-t2", "consulting", "technical", "What does MECE mean, and why is it useful? Give an example.", ["mutually exclusive", "collectively exhaustive", "overlap", "structure", "example", "revenue", "cost"],
    "Give an example of a structure that looks MECE but is not.", "Define it and show a clean split such as revenue and cost."),
  q("iv-cs-c1", "consulting", "case", "A regional airline's profits are falling. How would you approach the problem?", ["revenue", "cost", "price", "volume", "fixed", "variable", "segment", "competit"],
    "Costs are flat but revenue per seat is down. What do you look at?", "Profitability tree, then drill into the branch that moved."),
  q("iv-cs-c2", "consulting", "case", "A gym chain wants to enter a new city. What should it consider?", ["market", "size", "compet", "customer", "cost", "entry", "location", "risk"],
    "Would you recommend building, acquiring or franchising, and why?", "Market attractiveness, competition, capabilities, economics, entry mode."),
  q("iv-cs-r1", "consulting", "role", "Why consulting?", ["problem", "learn", "variety", "impact", "client", "team", "skill"],
    "What do you expect to find hardest about the job?", "Be specific and tie reasons to your own experiences."),
  q("iv-cs-r2", "consulting", "role", "A client disagrees strongly with your team's recommendation. What do you do?", ["listen", "understand", "data", "evidence", "concern", "option", "client", "align"],
    "What if the client's concern turns out to be valid?", "Listen first, find the concern, bring evidence and options."),

  // Software
  q("iv-sw-t1", "software", "technical", "Explain the difference between an array and a linked list. When would you use each?", ["array", "linked list", "index", "insert", "memory", "o(1)", "o(n)", "access"],
    "Which would you use to implement a queue, and why?", "Compare access, insertion and memory, then give a use case for each."),
  q("iv-sw-t2", "software", "technical", "What are the four pillars of object-oriented programming? Explain one with an example.", ["encapsulation", "inheritance", "polymorphism", "abstraction", "class", "object", "example"],
    "How does polymorphism help when adding a new feature?", "List all four, then go deep on one with a small example."),
  q("iv-sw-t3", "software", "technical", "What is database indexing, and what are its trade-offs?", ["index", "lookup", "faster", "write", "storage", "b-tree", "query", "trade-off"],
    "When would adding an index make things worse?", "Explain what it speeds up and what it costs."),
  q("iv-sw-c1", "software", "case", "How would you design a URL-shortening service at a high level?", ["hash", "database", "unique", "redirect", "cache", "scale", "collision", "api"],
    "How would you handle two long URLs producing the same short code?", "Clarify requirements, then API, data model, key generation and scaling."),
  q("iv-sw-r1", "software", "role", "Tell me about a project you built. What was the hardest technical problem?", ["project", "problem", "debug", "design", "solution", "learn", "built", "test"],
    "If you rebuilt it today, what would you change?", "Explain the problem, options you considered and why you chose your solution."),
  q("iv-sw-r2", "software", "role", "You discover a bug in production code you wrote. What do you do?", ["reproduce", "fix", "test", "communicat", "root cause", "rollback", "prevent", "team"],
    "How would you prevent the same class of bug in future?", "Contain first, communicate, fix with a test, then address root cause."),
];

export const INTERVIEW_MAP: Record<string, InterviewQuestion> = Object.fromEntries(
  INTERVIEW_QUESTIONS.map((x) => [x.id, x])
);

export function interviewPool(role: RoleId, type: InterviewType): InterviewQuestion[] {
  if (type === "hr" || type === "behavioural") return INTERVIEW_QUESTIONS.filter((x) => x.type === type);
  return INTERVIEW_QUESTIONS.filter((x) => x.type === type && x.role === role);
}
