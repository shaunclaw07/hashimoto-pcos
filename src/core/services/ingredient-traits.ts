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
  | "ultra-processed-additive";

export const INGREDIENT_TRAITS = {
  sugar: ["added-sugar", "high-glycemic-sweetener"],
  "glucose-syrup": ["added-sugar", "high-glycemic-sweetener"],
  dextrose: ["added-sugar", "high-glycemic-sweetener"],
  "fructose-syrup": ["added-sugar", "high-glycemic-sweetener"],
  "invert-sugar": ["added-sugar", "high-glycemic-sweetener"],
  "wheat-flour": ["gluten", "refined-grain"],
  "whole-wheat-flour": ["gluten", "whole-grain"],
  rye: ["gluten"],
  barley: ["gluten"],
  milk: ["dairy"],
  yogurt: ["dairy", "fermented-dairy"],
  cheese: ["dairy", "fermented-dairy"],
  whey: ["dairy", "whey"],
  casein: ["dairy", "casein"],
  soy: ["soy"],
  "soy-protein": ["soy"],
  tofu: ["soy"],
  tempeh: ["soy", "fermented-soy"],
  miso: ["soy", "fermented-soy"],
  "soy-lecithin": ["soy", "soy-lecithin"],
  salmon: ["omega3-marine"],
  mackerel: ["omega3-marine"],
  "fish-oil": ["omega3-marine"],
  flaxseed: ["omega3-plant", "nut-seed"],
  walnut: ["omega3-plant", "nut-seed"],
  "chia-seed": ["omega3-plant", "nut-seed"],
  almond: ["nut-seed"],
  hazelnut: ["nut-seed"],
  peanut: ["nut-seed"],
  sesame: ["nut-seed"],
  lentil: ["legume"],
  chickpea: ["legume"],
  bean: ["legume"],
  seaweed: ["iodine-rich"],
  nori: ["iodine-rich"],
  kelp: ["iodine-rich"],
  "iodized-salt": ["iodine-rich"],
  aspartame: ["non-nutritive-sweetener"],
  sucralose: ["non-nutritive-sweetener"],
  stevia: ["non-nutritive-sweetener"],
  erythritol: ["non-nutritive-sweetener"],
  xylitol: ["non-nutritive-sweetener"],
  carrageenan: ["ultra-processed-additive"],
} satisfies Partial<Record<CanonicalIngredientKey, IngredientTrait[]>>;

export function getIngredientTraits(canonicalKey: string): IngredientTrait[] {
  return (INGREDIENT_TRAITS as Record<string, IngredientTrait[]>)[canonicalKey] ?? [];
}
