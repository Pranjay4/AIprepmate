import { DEFAULT_REALISM, type RealismSettings } from "@/lib/schema";

const REALISM_KEY = "gdiscuss.realism.v1";
const USERNAME_KEY = "gdiscuss.username.v1";

export function getRealismSettings(): RealismSettings {
  if (typeof window === "undefined") return DEFAULT_REALISM;
  try {
    const raw = window.localStorage.getItem(REALISM_KEY);
    return raw ? { ...DEFAULT_REALISM, ...JSON.parse(raw) } : DEFAULT_REALISM;
  } catch {
    return DEFAULT_REALISM;
  }
}

export function saveRealismSettings(settings: RealismSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REALISM_KEY, JSON.stringify(settings));
}

export function getSavedUserName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USERNAME_KEY) || "";
}

export function saveUserName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERNAME_KEY, name);
}
