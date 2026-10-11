import type { AnswerEval, InterviewQuestion, InterviewType, MockInterview, RubricScore } from "./types";
import { avg, clamp } from "./util";

// Transparent, rule-based rubric. Every score is derived from countable signals in the
// text (listed back to the learner). It is practice feedback, not an AI judgement and
// not a measure of hiring readiness.

export const RUBRIC: { key: RubricScore["key"]; label: string; weight: number; desc: string }[] = [
  { key: "relevance", label: "Relevance to the question", weight: 0.25, desc: "Covers the concepts a relevant answer to this question usually touches." },
  { key: "structure", label: "Structure and clarity", weight: 0.2, desc: "Appropriate length, several sentences, ordering words and a clear close." },
  { key: "evidence", label: "Specific examples and evidence", weight: 0.2, desc: "Numbers, concrete examples and first-person actions." },
  { key: "depth", label: "Analytical depth", weight: 0.2, desc: "Reasoning words: causes, trade-offs, assumptions, risks, metrics." },
  { key: "communication", label: "Communication quality", weight: 0.15, desc: "Readable sentence length, few fillers and hedges, varied vocabulary." },
];

const ORDER = ["first", "second", "third", "then", "next", "finally", "to begin", "lastly", "after that", "step"];
const CLOSE = ["in summary", "overall", "to conclude", "as a result", "recommend", "the result", "i learned", "i learnt", "in the end", "so i would"];
const FRAME = ["situation", "task", "action", "result", "because", "therefore", "so that", "goal", "approach"];
const EXAMPLE = ["for example", "for instance", "such as", "e.g", "when i", "in my", "during my", "last year", "internship", "project", "at my", "once "];
const REASON = ["because", "therefore", "since", "so that", "which means", "as a result", "however", "although", "trade-off", "tradeoff", "on the other hand", "alternativ", "risk", "assum", "hypothes", "depends", "root cause", "metric", "measure", "impact", "priorit", "segment", "compare", "whereas"];
const FILLER = ["basically", "actually", "you know", "kind of", "sort of", "stuff", "things", "literally", "honestly"];
const HEDGE = ["maybe", "i think", "i guess", "probably", "perhaps", "might be"];

function count(text: string, terms: string[]): string[] {
  return terms.filter((t) => text.includes(t));
}
function occurrences(text: string, terms: string[]): number {
  return terms.reduce((n, t) => n + (text.split(t).length - 1), 0);
}

export function evaluateAnswer(q: InterviewQuestion, answer: string): AnswerEval {
  const raw = answer.trim();
  const text = ` ${raw.toLowerCase()} `;
  const words = raw.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sentences = raw.split(/[.!?]+\s|\n+/).filter((s) => s.trim().length > 3);

  if (wc < 5) {
    const rubric = RUBRIC.map((r) => ({ key: r.key, label: r.label, score: 1, signals: ["No answer was given."] }));
    return { questionId: q.id, prompt: q.prompt, answer: raw, rubric, score: 0 };
  }

  // Relevance
  const hits = count(text, q.keywords);
  const missing = q.keywords.filter((k) => !hits.includes(k));
  const ratio = hits.length / Math.min(q.keywords.length, 5);
  let relevance = ratio >= 0.8 ? 5 : ratio >= 0.6 ? 4 : ratio >= 0.4 ? 3 : ratio >= 0.2 ? 2 : 1;
  if (wc < 25) relevance = Math.min(relevance, 2);
  const relSignals = [
    hits.length ? `Touches expected concepts: ${hits.slice(0, 6).join(", ")}.` : "None of the concepts usually expected for this question were detected.",
    ...(missing.length && relevance < 5 ? [`Not detected: ${missing.slice(0, 4).join(", ")}.`] : []),
  ];

  // Structure
  const order = count(text, ORDER);
  const close = count(text, CLOSE);
  const frame = count(text, FRAME);
  let sp = 0;
  const sSignals: string[] = [];
  if (wc >= 80 && wc <= 320) { sp += 1; sSignals.push(`Length is appropriate (${wc} words).`); }
  else if (wc >= 40) { sp += 0.5; sSignals.push(wc > 320 ? `Long answer (${wc} words) — aim for 120–250.` : `Brief answer (${wc} words) — aim for 120–250.`); }
  else sSignals.push(`Very short answer (${wc} words).`);
  if (sentences.length >= 4) { sp += 1; sSignals.push(`${sentences.length} sentences give room for a beginning, middle and end.`); }
  if (order.length >= 2) { sp += 1; sSignals.push(`Ordering words used: ${order.slice(0, 4).join(", ")}.`); }
  else if (order.length === 1) { sp += 0.5; sSignals.push("Only one ordering word — signpost your steps."); }
  else sSignals.push("No ordering words (first, then, finally) detected.");
  if (frame.length >= 2) sp += 1;
  if (close.length) { sp += 1; sSignals.push("Ends with a result, summary or recommendation."); }
  else sSignals.push("No clear closing statement detected.");
  const structure = clamp(1 + Math.round(sp), 1, 5);

  // Evidence
  const numbers = (raw.match(/\d+(\.\d+)?%?/g) || []).length;
  const examples = count(text, EXAMPLE);
  const firstPerson = (text.match(/\bi (led|built|made|created|analy[sz]ed|decided|spoke|asked|proposed|organi[sz]ed|designed|wrote|learned|learnt|found|worked|managed|set|took|used|ran|helped|started|suggested|presented|would)\b/g) || []).length;
  let ep = 0;
  const eSignals: string[] = [];
  if (numbers >= 2) { ep += 1.5; eSignals.push(`${numbers} numbers or quantities used.`); }
  else if (numbers === 1) { ep += 1; eSignals.push("One number used — add another to make the result concrete."); }
  else eSignals.push("No numbers detected — quantify the outcome or the scale.");
  if (examples.length >= 2) { ep += 1.5; eSignals.push("Concrete examples are referenced."); }
  else if (examples.length === 1) { ep += 1; eSignals.push("One example marker found."); }
  else eSignals.push("No specific example detected (for example, when I…, in my project…).");
  if (firstPerson >= 3) { ep += 1; eSignals.push("Describes own actions in the first person."); }
  else if (firstPerson >= 1) ep += 0.5;
  const evidence = clamp(1 + Math.round(ep), 1, 5);

  // Analytical depth
  const reasons = count(text, REASON);
  let depth = reasons.length >= 6 ? 5 : reasons.length >= 4 ? 4 : reasons.length === 3 ? 3 : reasons.length >= 1 ? 2 : 1;
  if (wc < 40) depth = Math.min(depth, 2);
  const dSignals = [
    reasons.length ? `Reasoning words used: ${reasons.slice(0, 6).join(", ")}.` : "No reasoning words (because, therefore, trade-off, risk) detected.",
    ...(depth < 4 ? ["Explain why, name a trade-off or risk, and say how you would measure the outcome."] : []),
  ];

  // Communication
  const avgLen = wc / Math.max(1, sentences.length);
  const fillers = occurrences(text, FILLER);
  const hedges = occurrences(text, HEDGE);
  const variety = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""))).size / wc;
  let cp = 5;
  const cSignals: string[] = [];
  if (avgLen > 30) { cp -= 1.5; cSignals.push(`Sentences are long (about ${Math.round(avgLen)} words on average) — split them.`); }
  else if (avgLen < 6) { cp -= 1; cSignals.push("Sentences are very short and may read as fragments."); }
  else cSignals.push(`Sentence length is readable (about ${Math.round(avgLen)} words on average).`);
  if ((fillers / wc) * 100 > 3) { cp -= 1; cSignals.push(`${fillers} filler words detected.`); }
  if (hedges > 3) { cp -= 0.5; cSignals.push(`${hedges} hedging phrases (maybe, I think) weaken the answer.`); }
  if (wc < 40) { cp -= 2; cSignals.push("Too short to demonstrate communication skill."); }
  else if (wc > 400) { cp -= 1; cSignals.push("Too long — an interviewer would interrupt."); }
  if (variety < 0.4) { cp -= 1; cSignals.push("Vocabulary is repetitive."); }
  const communication = clamp(Math.round(cp), 1, 5);

  const scores = { relevance, structure, evidence, depth, communication };
  const signals = { relevance: relSignals, structure: sSignals, evidence: eSignals, depth: dSignals, communication: cSignals };
  const rubric: RubricScore[] = RUBRIC.map((r) => ({ key: r.key, label: r.label, score: scores[r.key], signals: signals[r.key] }));
  const score = Math.round((RUBRIC.reduce((s, r) => s + r.weight * scores[r.key], 0) / 5) * 100);
  return { questionId: q.id, prompt: q.prompt, answer: raw, rubric, score };
}

const STRENGTH: Record<RubricScore["key"], string> = {
  relevance: "Your answers stay on the question and cover the expected concepts.",
  structure: "Your answers are well organised, with clear ordering and a close.",
  evidence: "You back up claims with numbers and concrete examples.",
  depth: "You explain your reasoning, including trade-offs and risks.",
  communication: "Your writing is concise and easy to follow.",
};
const IMPROVE: Record<RubricScore["key"], string> = {
  relevance: "Some answers drift from what was asked or miss the core concepts.",
  structure: "Answers need a clearer shape: signpost the steps and end with a conclusion.",
  evidence: "Answers are general — few numbers or specific examples were detected.",
  depth: "Reasoning stays at the surface: little on causes, trade-offs or measurement.",
  communication: "Sentence length, fillers or answer length are getting in the way of clarity.",
};
const RECOMMEND: Record<RubricScore["key"], string> = {
  relevance: "Before answering, restate the question in one line and list the two or three concepts it is testing.",
  structure: "Draft each answer as three or four bullets first: opening, two supporting points, close.",
  evidence: "Add one number and one named example to every answer — scale, time saved, percentage change.",
  depth: "For each claim add a 'because', one trade-off or risk, and how you would measure success.",
  communication: "Aim for 120–250 words per answer with sentences under 25 words; remove fillers on a second read.",
};

export function summariseInterview(answers: AnswerEval[], type: InterviewType) {
  const rubric = RUBRIC.map((r) => ({
    key: r.key,
    label: r.label,
    score: Math.round(avg(answers.map((a) => a.rubric.find((x) => x.key === r.key)!.score)) * 10) / 10,
  }));
  const overall = Math.round(avg(answers.map((a) => a.score)));
  const sorted = [...rubric].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter((r) => r.score >= 3.5).slice(0, 2).map((r) => STRENGTH[r.key]);
  const weak = [...sorted].reverse().filter((r) => r.score < 4).slice(0, 3);
  const improvements = weak.map((r) => IMPROVE[r.key]);
  const recommendations = weak.map((r) => RECOMMEND[r.key]);
  if (answers.some((a) => a.score === 0)) {
    improvements.unshift("One or more questions were left unanswered.");
    recommendations.unshift("Attempt every question — a partial structured answer scores better than a blank.");
  }
  if ((type === "behavioural" || type === "hr") && (rubric.find((r) => r.key === "structure")!.score < 3.5)) {
    recommendations.push("Use the STAR structure: Situation, Task, Action, Result.");
  }
  return { overall, rubric, strengths, improvements, recommendations };
}

export function weakestDimension(i: MockInterview): RubricScore["key"] {
  return [...i.rubric].sort((a, b) => a.score - b.score)[0].key;
}
