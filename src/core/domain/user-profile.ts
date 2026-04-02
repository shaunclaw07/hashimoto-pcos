// Phase 2 — not wired up yet.
export type Condition = "hashimoto" | "pcos" | "both";

export interface UserProfile {
  condition: Condition;
  glutenSensitive: boolean;
  lactoseIntolerant: boolean;
}
