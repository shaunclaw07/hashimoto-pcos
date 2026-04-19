import { describe, expect, it } from "vitest";
import { getIngredientTraits } from "./ingredient-traits";

describe("getIngredientTraits", () => {
  it("classifies added sugars", () => {
    expect(getIngredientTraits("sugar")).toContain("added-sugar");
    expect(getIngredientTraits("glucose-syrup")).toEqual(
      expect.arrayContaining(["added-sugar", "high-glycemic-sweetener"])
    );
    expect(getIngredientTraits("dextrose")).toContain("added-sugar");
    expect(getIngredientTraits("fructose-syrup")).toContain("added-sugar");
    expect(getIngredientTraits("invert-sugar")).toContain("added-sugar");
  });

  it("classifies refined and whole gluten grains", () => {
    expect(getIngredientTraits("wheat-flour")).toEqual(
      expect.arrayContaining(["gluten", "refined-grain"])
    );
    expect(getIngredientTraits("whole-wheat-flour")).toEqual(
      expect.arrayContaining(["gluten", "whole-grain"])
    );
    expect(getIngredientTraits("rye")).toContain("gluten");
    expect(getIngredientTraits("barley")).toContain("gluten");
  });

  it("classifies dairy tiers", () => {
    expect(getIngredientTraits("milk")).toContain("dairy");
    expect(getIngredientTraits("yogurt")).toEqual(expect.arrayContaining(["dairy", "fermented-dairy"]));
    expect(getIngredientTraits("cheese")).toEqual(expect.arrayContaining(["dairy", "fermented-dairy"]));
    expect(getIngredientTraits("whey")).toEqual(expect.arrayContaining(["dairy", "whey"]));
    expect(getIngredientTraits("casein")).toEqual(expect.arrayContaining(["dairy", "casein"]));
  });

  it("classifies soy variants", () => {
    expect(getIngredientTraits("soy")).toContain("soy");
    expect(getIngredientTraits("soy-protein")).toContain("soy");
    expect(getIngredientTraits("tofu")).toContain("soy");
    expect(getIngredientTraits("tempeh")).toEqual(expect.arrayContaining(["soy", "fermented-soy"]));
    expect(getIngredientTraits("miso")).toEqual(expect.arrayContaining(["soy", "fermented-soy"]));
    expect(getIngredientTraits("soy-lecithin")).toEqual(expect.arrayContaining(["soy", "soy-lecithin"]));
  });

  it("classifies omega-3 sources", () => {
    expect(getIngredientTraits("salmon")).toContain("omega3-marine");
    expect(getIngredientTraits("mackerel")).toContain("omega3-marine");
    expect(getIngredientTraits("fish-oil")).toContain("omega3-marine");
    expect(getIngredientTraits("flaxseed")).toEqual(expect.arrayContaining(["omega3-plant", "nut-seed"]));
    expect(getIngredientTraits("walnut")).toEqual(expect.arrayContaining(["omega3-plant", "nut-seed"]));
    expect(getIngredientTraits("chia-seed")).toEqual(expect.arrayContaining(["omega3-plant", "nut-seed"]));
  });

  it("classifies nuts, seeds, and legumes", () => {
    expect(getIngredientTraits("almond")).toContain("nut-seed");
    expect(getIngredientTraits("hazelnut")).toContain("nut-seed");
    expect(getIngredientTraits("peanut")).toContain("nut-seed");
    expect(getIngredientTraits("sesame")).toContain("nut-seed");
    expect(getIngredientTraits("lentil")).toContain("legume");
    expect(getIngredientTraits("chickpea")).toContain("legume");
    expect(getIngredientTraits("bean")).toContain("legume");
  });

  it("classifies iodine-rich ingredients", () => {
    expect(getIngredientTraits("seaweed")).toContain("iodine-rich");
    expect(getIngredientTraits("nori")).toContain("iodine-rich");
    expect(getIngredientTraits("kelp")).toContain("iodine-rich");
    expect(getIngredientTraits("iodized-salt")).toContain("iodine-rich");
  });

  it("classifies non-nutritive sweeteners", () => {
    expect(getIngredientTraits("aspartame")).toContain("non-nutritive-sweetener");
    expect(getIngredientTraits("sucralose")).toContain("non-nutritive-sweetener");
    expect(getIngredientTraits("stevia")).toContain("non-nutritive-sweetener");
    expect(getIngredientTraits("erythritol")).toContain("non-nutritive-sweetener");
    expect(getIngredientTraits("xylitol")).toContain("non-nutritive-sweetener");
  });

  it("classifies ultra-processed additives", () => {
    expect(getIngredientTraits("carrageenan")).toContain("ultra-processed-additive");
  });

  it("returns an empty array for unknown canonical keys", () => {
    expect(getIngredientTraits("unknown-key")).toEqual([]);
  });

  it("has traits for scoring-relevant canonical keys", () => {
    const relevantKeys = [
      "sugar",
      "glucose-syrup",
      "wheat-flour",
      "milk",
      "soy",
      "salmon",
      "soy-lecithin",
    ];
    for (const key of relevantKeys) {
      expect(getIngredientTraits(key).length).toBeGreaterThan(0);
    }
  });
});
