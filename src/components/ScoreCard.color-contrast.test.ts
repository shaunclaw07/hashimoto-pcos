import { describe, it, expect } from "vitest";

// Light mode CSS variable values
const LIGHT_MODE_SCORE_COLORS = {
  "SEHR GUT": "#22c55e",
  GUT: "#84cc16",
  NEUTRAL: "#a16207",
  "WENIGER GUT": "#c2410c",
  VERMEIDEN: "#ef4444",
} as const;

// Dark mode CSS variable values
const DARK_MODE_SCORE_COLORS = {
  "SEHR GUT": "#86efac",
  GUT: "#a3e635",
  NEUTRAL: "#fde047",
  "WENIGER GUT": "#fdba74",
  VERMEIDEN: "#fca5a5",
} as const;

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
const DARK_BG = "#121014";
const WCAG_AA_NORMAL = 4.5;

describe("SCORE_CONFIG color contrast (WCAG AA)", () => {
  describe("light mode (on white background)", () => {
    it("NEUTRAL color meets 4.5:1 against white", () => {
      const ratio = contrastRatio(LIGHT_MODE_SCORE_COLORS.NEUTRAL, WHITE);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it("WENIGER GUT color meets 4.5:1 against white", () => {
      const ratio = contrastRatio(LIGHT_MODE_SCORE_COLORS["WENIGER GUT"], WHITE);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe("dark mode (on dark background)", () => {
    it("NEUTRAL color meets 4.5:1 against dark background", () => {
      const ratio = contrastRatio(DARK_MODE_SCORE_COLORS.NEUTRAL, DARK_BG);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it("WENIGER GUT color meets 4.5:1 against dark background", () => {
      const ratio = contrastRatio(DARK_MODE_SCORE_COLORS["WENIGER GUT"], DARK_BG);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });
});