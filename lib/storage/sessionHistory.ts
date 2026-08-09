import type { CompletedSession, UserProfile } from "@/lib/schema";

const SESSIONS_KEY = "gdiscuss.sessions.v1";
const PROFILE_KEY = "gdiscuss.profile.v1";

export function getSessions(): CompletedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompletedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: CompletedSession): void {
  if (typeof window === "undefined") return;
  const sessions = getSessions();
  sessions.push(session);
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function clearSessions(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSIONS_KEY);
}

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export interface WeaknessFrequency {
  weakness: string;
  count: number;
}

export function aggregateWeaknesses(sessions: CompletedSession[]): WeaknessFrequency[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    for (const w of s.report.weaknesses) {
      map.set(w, (map.get(w) || 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([weakness, count]) => ({ weakness, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeTrend(sessions: CompletedSession[]) {
  return sessions.map((s, i) => ({
    session: i + 1,
    date: s.dateIso.slice(0, 10),
    overall: s.report.overallScore,
    content: s.report.scores.content,
    structure: s.report.scores.structure,
    clarity: s.report.scores.clarity,
    communication: s.report.scores.communication,
    businessThinking: s.report.scores.businessThinking,
    listeningBuilding: s.report.scores.listeningBuilding,
    leadership: s.report.scores.leadership,
    participation: s.report.scores.participation,
  }));
}
