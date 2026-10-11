import type { LearningModule, RoleId } from "../types";
import { BA_MODULES } from "./modules-ba";
import { PM_MODULES } from "./modules-pm";
import { MORE_MODULES } from "./modules-more";

export const MODULES: LearningModule[] = [...BA_MODULES, ...PM_MODULES, ...MORE_MODULES];
export const MODULE_MAP: Record<string, LearningModule> = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export function modulesForRole(role: RoleId): LearningModule[] {
  return MODULES.filter((m) => m.roles.includes(role));
}

/** Best module to revise a topic for a given role, if one exists. */
export function moduleForTopic(topic: string, role?: RoleId | null): LearningModule | undefined {
  const matches = MODULES.filter((m) => m.topic === topic);
  return matches.find((m) => !role || m.roles.includes(role)) ?? matches[0];
}
