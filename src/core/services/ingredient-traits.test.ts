import { describe, expect, it } from "vitest";
import { getIngredientTraits } from "./ingredient-traits";

describe("getIngredientTraits", () => {
  it("classifies added sugars", () => {
    expect(getIngredientTraits("sugar")).toContain("added-sugar");
    expect(getIngredientTraits("glucose-syrup")).toEqual(
      expect.arrayContaining(["added-sugar", "high-glycemic-sweetener"])
    );
  });

  it("classifies refined and whole gluten grains", () => {
    expect(getIngredientTraits("wheat-flour")).toEqual(
      expect.arrayContaining(["gluten", "refined-grain"])
    );
    expect(getIngredientTraits("whole-wheat-flour")).toEqual(
      expect.arrayContaining(["gluten", "whole-grain"])
    );
  });

  it("classifies dairy tiers", () => {
    expect(getIngredientTraits("milk")).toContain("dairy");
    expect(getIngredientTraits("yogurt")).toEqual(expect.arrayContaining(["dairy", "fermented-dairy"]));
    expect(getIngredientTraits("whey")).toEqual(expect.arrayContaining(["dairy", "whey"]));
  });

  it("classifies soy variants", () => {
    expect(getIngredientTraits("soy")).toContain("soy");
    expect(getIngredientTraits("tempeh")).toEqual(expect.arrayContaining(["soy", "fermented-soy"]));
    expect(getIngredientTraits("soy-lecithin")).toEqual(expect.arrayContaining(["soy", "soy-lecithin"]));
  });

  it("classifies omega-3 sources", () => {
    expect(getIngredientTraits("salmon")).toContain("omega3-marine");
    expect(getIngredientTraits("flaxseed")).toEqual(expect.arrayContaining(["omega3-plant", "nut-seed"]));
  });

  it("returns an empty array for unknown canonical keys", () => {
    expect(getIngredientTraits("unknown-key")).toEqual([]);
  });

  it("has traits for scoring-relevant canonical keys", () => {
    const relevantKeys = ["sugar", "glucose-syrup", "wheat-flour", "milk", "soy", "salmon"];
    for (const key of relevantKeys) {
      expect(getIngredientTraits(key).length).toBeGreaterThan(0);
    }
  });
});
