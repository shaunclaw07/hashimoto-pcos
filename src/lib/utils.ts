import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatScore(score: number): string {
  if (score >= 4.5) return "SEHR GUT";
  if (score >= 3.5) return "GUT";
  if (score >= 2.5) return "NEUTRAL";
  if (score >= 1.5) return "WENIGER GUT";
  return "VERMEIDEN";
}

export function getScoreColor(score: number): string {
  if (score >= 4.5) return "#22c55e";
  if (score >= 3.5) return "#84cc16";
  if (score >= 2.5) return "#eab308";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
}

export function getScoreEmoji(score: number): string {
  if (score >= 4.5) return "🟢";
  if (score >= 3.5) return "🟢";
  if (score >= 2.5) return "🟡";
  if (score >= 1.5) return "🟠";
  return "🔴";
}
