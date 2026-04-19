import { normalizeIngredientName } from "./ingredient-normalization";

export type CanonicalIngredientKey = string;

export interface IngredientAliasMatch {
  input: string;
  normalizedInput: string;
  canonicalKey: CanonicalIngredientKey;
}

export const INGREDIENT_ALIASES: Record<string, CanonicalIngredientKey> = {
  zucker: "sugar",
  sugar: "sugar",
  sucre: "sugar",
  saccharose: "sugar",
  sucrose: "sugar",
  glukosesirup: "glucose-syrup",
  "glucose syrup": "glucose-syrup",
  "sirop de glucose": "glucose-syrup",
  milch: "milk",
  milk: "milk",
  lait: "milk",
  joghurt: "yogurt",
  yogurt: "yogurt",
  yaourt: "yogurt",
  weizenmehl: "wheat-flour",
  "weizen mehl": "wheat-flour",
  "wheat flour": "wheat-flour",
  "farine de ble": "wheat-flour",
  weizenvollkornmehl: "whole-wheat-flour",
  "whole wheat flour": "whole-wheat-flour",
  soja: "soy",
  soy: "soy",
  tofu: "tofu",
  tempeh: "tempeh",
  miso: "miso",
  lachs: "salmon",
  salmon: "salmon",
  saumon: "salmon",
  leinsamen: "flaxseed",
  flaxseed: "flaxseed",
  linseed: "flaxseed",
  "graine de lin": "flaxseed",
};

export function resolveIngredientAlias(input: string): IngredientAliasMatch | null {
  const normalizedInput = normalizeIngredientName(input);
  const canonicalKey = INGREDIENT_ALIASES[normalizedInput];
  if (!canonicalKey) return null;
  return { input, normalizedInput, canonicalKey };
}
