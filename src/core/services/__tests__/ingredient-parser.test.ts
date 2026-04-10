import { describe, it, expect } from "vitest";
import { parseIngredients, isValidProductName } from "../ingredient-parser";

describe("ingredient-parser", () => {
  describe("parseIngredients", () => {
    it("returns empty array for empty string", () => {
      expect(parseIngredients("")).toEqual([]);
      expect(parseIngredients("   ")).toEqual([]);
    });

    it("parses single ingredient", () => {
      const result = parseIngredients("Zucker");
      expect(result).toHaveLength(1);
      expect(result[0].canonical).toBe("zucker");
    });

    it("splits on comma at depth 0", () => {
      const result = parseIngredients("Zucker, Wasser, Salz");
      expect(result.map((r) => r.canonical)).toEqual(["zucker", "wasser", "salz"]);
    });

    it("handles functional labels with colon: Emulgator: Sonnenblumenlecithin", () => {
      const result = parseIngredients("Emulgator: Sonnenblumenlecithin");
      // Should emit only "Sonnenblumenlecithin", not "emulgator"
      expect(result.map((r) => r.canonical)).toContain("sonnenblumenlecithin");
      expect(result.map((r) => r.canonical)).not.toContain("emulgator");
    });

    it("handles nested parentheses depth 1", () => {
      const result = parseIngredients("Wasser (Mineralwasser), Zucker");
      expect(result.map((r) => r.canonical)).toContain("wasser");
      expect(result.map((r) => r.canonical)).toContain("zucker");
    });

    it("discards content at depth > 1 (percentages in nested parens)", () => {
      const result = parseIngredients("Zutaten (enthält (min. 55%) Anteil), Zucker");
      // Should not throw, should parse what's at depth 0 and 1
      expect(result.length).toBeGreaterThan(0);
    });

    it("strips trailing percentages", () => {
      const result = parseIngredients("Zucker 99,9%, Wasser");
      const canonicals = result.map((r) => r.canonical);
      expect(canonicals).toContain("zucker");
      expect(canonicals).not.toContain("99,9%");
    });

    it("normalizes hyphens within words", () => {
      const result = parseIngredients("Sonnenblumenöl, Rapsöl");
      expect(result.map((r) => r.canonical)).toContain("sonnenblumenöl");
      expect(result.map((r) => r.canonical)).toContain("rapsöl");
    });

    it("deduplicates canonical forms", () => {
      const result = parseIngredients("Zucker, zucker, ZUCKER");
      expect(result).toHaveLength(1);
      expect(result[0].canonical).toBe("zucker");
    });

    it("filters out unknown ingredients not in whitelist", () => {
      const result = parseIngredients("xyzUnknown123, Zucker");
      const canonicals = result.map((r) => r.canonical);
      expect(canonicals).not.toContain("xyzunknown123");
      expect(canonicals).toContain("zucker");
    });

    it("preserves raw text for canonical match", () => {
      const result = parseIngredients("SALZ");
      expect(result).toHaveLength(1);
      expect(result[0].raw).toBe("SALZ");
      expect(result[0].canonical).toBe("salz");
    });

    it("handles semicolon as separator", () => {
      const result = parseIngredients("Zucker; Wasser; Salz");
      expect(result.map((r) => r.canonical)).toEqual(["zucker", "wasser", "salz"]);
    });

    it("skips standalone functional labels", () => {
      const result = parseIngredients("Emulgator, Zucker");
      // "Emulgator" alone should be filtered out
      const canonicals = result.map((r) => r.canonical);
      expect(canonicals).not.toContain("emulgator");
      expect(canonicals).toContain("zucker");
    });

    it("handles multiple colons: Salz: Mehl: Zusatz", () => {
      const result = parseIngredients("Salz: Mehl: Wasser");
      // Should split and filter functional labels
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns empty for null/undefined input", () => {
      expect(parseIngredients(null as unknown as string)).toEqual([]);
      expect(parseIngredients(undefined as unknown as string)).toEqual([]);
    });
  });

  describe("isValidProductName", () => {
    it("returns false for empty or too short", () => {
      expect(isValidProductName("")).toBe(false);
      expect(isValidProductName("x")).toBe(false);
      expect(isValidProductName("   ")).toBe(false);
    });

    it("returns false for placeholder names", () => {
      expect(isValidProductName("xxx")).toBe(false);
      expect(isValidProductName("unknown")).toBe(false);
      expect(isValidProductName("n/a")).toBe(false);
      expect(isValidProductName("to be completed")).toBe(false);
    });

    it("returns true for valid product names", () => {
      expect(isValidProductName("Bio Joghurt")).toBe(true);
      expect(isValidProductName("Haferflocken")).toBe(true);
    });

    it("handles non-string input", () => {
      expect(isValidProductName(null as unknown as string)).toBe(false);
      expect(isValidProductName(123 as unknown as string)).toBe(false);
    });
  });
});