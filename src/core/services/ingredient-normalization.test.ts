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

  it("normalizes whitespace and dash variants", () => {
    expect(normalizeIngredientName("Weizen  -  Mehl")).toBe("weizen mehl");
    expect(normalizeIngredientName("glucose–fructose syrup")).toBe("glucose-fructose syrup");
    expect(normalizeIngredientName("  lait    écrémé  ")).toBe("lait ecreme");
  });
});
