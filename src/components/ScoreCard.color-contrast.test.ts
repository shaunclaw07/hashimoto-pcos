import { describe, it, expect } from "vitest";
import { SCORE_CONFIG } from "./ScoreCard";

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

const WHITE = "#ffffff";
const WCAG_AA_NORMAL = 4.5;

describe("SCORE_CONFIG color contrast (WCAG AA)", () => {
  it("NEUTRAL color meets 4.5:1 against white", () => {
    const ratio = contrastRatio(SCORE_CONFIG.NEUTRAL.color, WHITE);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it("WENIGER GUT color meets 4.5:1 against white", () => {
    const ratio = contrastRatio(SCORE_CONFIG["WENIGER GUT"].color, WHITE);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });
});