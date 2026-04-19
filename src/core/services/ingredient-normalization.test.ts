import { describe, expect, it } from "vitest";
import { normalizeIngredientName } from "./ingredient-normalization";

describe("normalizeIngredientName", () => {
  it("normalizes basic German, English and French ingredient names", () => {
    expect(normalizeIngredientName(" Zucker ")).toBe("zucker");
    expect(normalizeIngredientName("Sugar")).toBe("sugar");
    expect(normalizeIngredientName("Sucre")).toBe("sucre");
  });

  it("normalizes accents for stable alias matching", () => {
    expect(normalizeIngredientName("farine de blé")).toBe("farine de ble");
    expect(normalizeIngredientName("crème fraîche")).toBe("creme fraiche");
  });

  it("normalizes E-number spellings", () => {
    expect(normalizeIngredientName("E 322")).toBe("e322");
    expect(normalizeIngredientName("E-322")).toBe("e322");
    expect(normalizeIngredientName(" e 322 ")).toBe("e322");
  });

  it("normalizes E-number with letter suffix", () => {
    expect(normalizeIngredientName("E160a")).toBe("e160a");
    expect(normalizeIngredientName("E 160a")).toBe("e160a");
    expect(normalizeIngredientName("E-160a")).toBe("e160a");
  });

  it("normalizes whitespace and dash variants", () => {
    expect(normalizeIngredientName("Weizen  -  Mehl")).toBe("weizen mehl");
    expect(normalizeIngredientName("glucose–fructose syrup")).toBe("glucose-fructose syrup");
    expect(normalizeIngredientName("  lait    écrémé  ")).toBe("lait ecreme");
  });

  it("normalizes spaced dashes adjacent to digits", () => {
    expect(normalizeIngredientName("e322 - sojalecithin")).toBe("e322 sojalecithin");
    expect(normalizeIngredientName("omega-3 - fischöl")).toBe("omega-3 fischol");
  });

  it("handles empty and whitespace-only input", () => {
    expect(normalizeIngredientName("")).toBe("");
    expect(normalizeIngredientName("   ")).toBe("");
  });

  it("handles multiple E-numbers in one string", () => {
    expect(normalizeIngredientName("E 322 und E 440")).toBe("e322 und e440");
    expect(normalizeIngredientName("E-322, E-440")).toBe("e322, e440");
  });

  it("normalizes German eszett for keyword matching", () => {
    expect(normalizeIngredientName("GROß")).toBe("gross");
    expect(normalizeIngredientName("Weißbrot")).toBe("weissbrot");
  });
});
