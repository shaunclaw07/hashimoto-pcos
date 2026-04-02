export interface ScoreBreakdownItem {
  reason: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  stars: 1 | 2 | 3 | 4 | 5;
  label: ScoreLabel;
  breakdown: ScoreBreakdownItem[];
  bonuses: number;
  maluses: number;
}

export type ScoreLabel =
  | "SEHR GUT"
  | "GUT"
  | "NEUTRAL"
  | "WENIGER GUT"
  | "VERMEIDEN";
