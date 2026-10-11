import type { Question, QuestionResponse } from "./types";

/**
 * Written answers are checked with a transparent keyword-based key-point check.
 * It is not AI and cannot judge reasoning quality — the UI labels it accordingly
 * and always shows the model answer for self-review.
 */
export function gradeWritten(q: Question, answer: string): QuestionResponse {
  const text = ` ${answer.toLowerCase()} `;
  const points = q.keyPoints ?? [];
  const matched = points.filter((p) => p.any.some((term) => text.includes(term.toLowerCase()))).map((p) => p.label);
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const score = points.length && words >= 8 ? matched.length / points.length : 0;
  return {
    questionId: q.id,
    topic: q.topic,
    type: q.type,
    answer,
    score,
    correct: score >= 0.6,
    matched,
    detail: words < 8 ? "Answer too short to check." : `${matched.length} of ${points.length} key points detected.`,
  };
}

export function gradeMcq(q: Question, answer: number | null): QuestionResponse {
  const correct = answer !== null && answer === q.answer;
  return { questionId: q.id, topic: q.topic, type: q.type, answer, correct, score: correct ? 1 : 0 };
}

export function unanswered(q: Question): QuestionResponse {
  return { questionId: q.id, topic: q.topic, type: q.type, answer: null, correct: false, score: 0, detail: "Not answered." };
}

export function scorePct(responses: QuestionResponse[]): number {
  if (!responses.length) return 0;
  return Math.round((responses.reduce((s, r) => s + r.score, 0) / responses.length) * 100);
}
