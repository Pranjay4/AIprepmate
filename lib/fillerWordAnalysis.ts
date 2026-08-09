// Client-side heuristics for the voice-mode "speech analysis" panel.
// These are estimates derived from timing and word patterns in the browser's
// speech-recognition output — not a measured/validated confidence signal.

const FILLER_PHRASES = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "i mean",
  "so yeah",
  "literally",
];

export interface SpeechMetrics {
  wordCount: number;
  durationSeconds: number;
  wordsPerMinute: number;
  fillerWordCount: number;
  fillerWords: string[];
  pauseCount: number;
  longestPauseSeconds: number;
  endsAbruptly: boolean;
  paceLabel: "slow" | "natural" | "fast";
}

export function analyzeSpeech(params: {
  text: string;
  durationSeconds: number;
  phraseGapsSeconds: number[];
}): SpeechMetrics {
  const words = params.text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wordsPerMinute = params.durationSeconds > 0 ? Math.round((wordCount / params.durationSeconds) * 60) : 0;

  const lower = params.text.toLowerCase();
  const fillerWords: string[] = [];
  for (const phrase of FILLER_PHRASES) {
    const pattern = new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "g");
    const matches = lower.match(pattern);
    if (matches) fillerWords.push(...matches);
  }

  const pauses = params.phraseGapsSeconds.filter((g) => g > 1.2);
  const trimmed = params.text.trim();
  const endsAbruptly = trimmed.length > 0 && !/[.!?]["')]?$/.test(trimmed);

  let paceLabel: SpeechMetrics["paceLabel"] = "natural";
  if (wordsPerMinute > 0 && wordsPerMinute < 100) paceLabel = "slow";
  else if (wordsPerMinute > 175) paceLabel = "fast";

  return {
    wordCount,
    durationSeconds: params.durationSeconds,
    wordsPerMinute,
    fillerWordCount: fillerWords.length,
    fillerWords,
    pauseCount: pauses.length,
    longestPauseSeconds: pauses.length ? Math.max(...pauses) : 0,
    endsAbruptly,
    paceLabel,
  };
}
