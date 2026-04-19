import type { CanonicalIngredientKey } from "./ingredient-aliases";

export type IngredientTrait =
  | "added-sugar"
  | "high-glycemic-sweetener"
  | "non-nutritive-sweetener"
  | "gluten"
  | "refined-grain"
  | "whole-grain"
  | "dairy"
  | "fermented-dairy"
  | "casein"
  | "whey"
  | "soy"
  | "fermented-soy"
  | "soy-lecithin"
  | "omega3-marine"
  | "omega3-plant"
  | "legume"
  | "nut-seed"
  | "iodine-rich"
  | "raw-goitrogen-risk"
  | "ultra-processed-additive";

export const INGREDIENT_TRAITS: Record<CanonicalIngredientKey, IngredientTrait[]> = {
  sugar: ["added-sugar", "high-glycemic-sweetener"],
  "glucose-syrup": ["added-sugar", "high-glycemic-sweetener"],
  "wheat-flour": ["gluten", "refined-grain"],
  "whole-wheat-flour": ["gluten", "whole-grain"],
  milk: ["dairy"],
  yogurt: ["dairy", "fermented-dairy"],
  whey: ["dairy", "whey"],
  casein: ["dairy", "casein"],
  soy: ["soy"],
  tofu: ["soy"],
  tempeh: ["soy", "fermented-soy"],
  miso: ["soy", "fermented-soy"],
  "soy-lecithin": ["soy", "soy-lecithin"],
  salmon: ["omega3-marine"],
  flaxseed: ["omega3-plant", "nut-seed"],
  walnut: ["omega3-plant", "nut-seed"],
  lentil: ["legume"],
  seaweed: ["iodine-rich"],
};

export function getIngredientTraits(canonicalKey: CanonicalIngredientKey): IngredientTrait[] {
  return INGREDIENT_TRAITS[canonicalKey] ?? [];
}
