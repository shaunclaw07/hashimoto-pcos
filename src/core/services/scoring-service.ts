// src/core/services/scoring-service.ts
import type { Product } from "../domain/product";
import type { ScoreResult, ScoreBreakdownItem } from "../domain/score";
import type { UserProfile, Condition } from "../domain/user-profile";
import { clamp } from "../../lib/utils";

/**
 * Validiert Nährwerte und clampt sie in physiologisch realistische Bereiche.
 * Negative oder unrealistisch hohe Werte werden korrigiert.
 * Fixes: https://github.com/shaunclaw07/hashimoto-pcos/issues/32
 */
export function validateNutriments(n: {
  energyKcal?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  salt?: number;
}): {
  energyKcal: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
} {
  return {
    energyKcal: clamp(n.energyKcal ?? 0, 0, 4000),
    fat: clamp(n.fat ?? 0, 0, 100),
    saturatedFat: clamp(n.saturatedFat ?? 0, 0, 100),
    carbohydrates: clamp(n.carbohydrates ?? 0, 0, 100),
    sugars: clamp(n.sugars ?? 0, 0, 100),
    fiber: clamp(n.fiber ?? 0, 0, 100),
    protein: clamp(n.protein ?? 0, 0, 100),
    salt: clamp(n.salt ?? 0, 0, 100),
  };
}

function containsIgnoreCase(str: string | undefined, search: string): boolean {
  if (!str) return false;
  return str.toLowerCase().includes(search.toLowerCase());
}

// =====================================================================
// Lookup tables for profile-aware scoring
// =====================================================================

type ConditionKey = "generic" | Condition;

/** Fiber > 6g bonus per condition */
const FIBER_HIGH_BONUS: Record<ConditionKey, number> = {
  generic:   1.0,
  hashimoto: 1.0,
  pcos:      1.5,
  both:      1.5,
};

/** Fiber > 3g bonus per condition */
const FIBER_MID_BONUS: Record<ConditionKey, number> = {
  generic:   0.5,
  hashimoto: 0.5,
  pcos:      0.5,
  both:      0.5,
};

/** Protein > 20g bonus per condition */
const PROTEIN_BONUS: Record<ConditionKey, number> = {
  generic:   0.5,
  hashimoto: 0.5,
  pcos:      1.0,
  both:      1.0,
};

/** Bio label bonus per condition */
const BIO_BONUS: Record<ConditionKey, number> = {
  generic:   0.5,
  hashimoto: 0.5,
  pcos:      0.3,
  both:      0.5,
};

/** Gluten-free label bonus per condition */
const GLUTEN_FREE_BONUS: Record<ConditionKey, number> = {
  generic:   0.5,
  hashimoto: 0.5,
  pcos:      0.2,
  both:      0.8,
};

/** Sugar > 5g malus per condition (only applies in profile mode) */
const SUGAR_5_MALUS: Record<ConditionKey, number> = {
  generic:   0,   // not used in generic mode
  hashimoto: 0.5,
  pcos:      1.5,
  both:      2.0,
};

/** Sugar > 10g malus per condition */
const SUGAR_10_MALUS: Record<ConditionKey, number> = {
  generic:   1.0,
  hashimoto: 1.0,
  pcos:      2.5,
  both:      3.0,
};

/** Sugar > 20g malus per condition */
const SUGAR_20_MALUS: Record<ConditionKey, number> = {
  generic:   2.0,
  hashimoto: 2.0,
  pcos:      3.5,
  both:      4.0,
};

/** Gluten ingredient malus per condition */
const GLUTEN_MALUS: Record<ConditionKey, number> = {
  generic:   0.5,
  hashimoto: 1.5,
  pcos:      0.5,
  both:      2.0,
};

/**
 * Calculates health score for a product (1.0–5.0).
 *
 * When a UserProfile is provided, scoring thresholds are adjusted
 * based on the user's condition (hashimoto/pcos/both) and dietary
 * sensitivities (glutenSensitive, lactoseIntolerant).
 *
 * @param product - The product to score
 * @param profile - Optional user profile for personalized scoring
 */
export function calculateScore(product: Product, profile?: UserProfile): ScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let bonusPoints = 0;
  let malusPoints = 0;

  const n = validateNutriments(product.nutriments);
  const conditionKey: ConditionKey = profile?.condition ?? "generic";

  // === BONUS POINTS ===

  const fiberHighBonus = FIBER_HIGH_BONUS[conditionKey];
  const fiberMidBonus = FIBER_MID_BONUS[conditionKey];

  if ((n.fiber ?? 0) > 6) {
    bonusPoints += fiberHighBonus;
    const item: ScoreBreakdownItem = { reason: "Ballaststoffe > 6g/100g", points: fiberHighBonus };
    if (profile && fiberHighBonus !== FIBER_HIGH_BONUS.generic) {
      item.condition = profile.condition;
    }
    breakdown.push(item);
  } else if ((n.fiber ?? 0) > 3) {
    bonusPoints += fiberMidBonus;
    breakdown.push({ reason: "Ballaststoffe > 3g/100g", points: fiberMidBonus });
  }

  const proteinBonus = PROTEIN_BONUS[conditionKey];
  if ((n.protein ?? 0) > 20) {
    bonusPoints += proteinBonus;
    const item: ScoreBreakdownItem = { reason: "Protein > 20g/100g", points: proteinBonus };
    if (profile && proteinBonus !== PROTEIN_BONUS.generic) {
      item.condition = profile.condition;
    }
    breakdown.push(item);
  }

  const hasOmega3 =
    product.categories.some(
      (c) => containsIgnoreCase(c, "omega-3") || containsIgnoreCase(c, "omega 3")
    ) ||
    product.labels.some(
      (l) => containsIgnoreCase(l, "omega-3") || containsIgnoreCase(l, "omega 3")
    );

  if (hasOmega3) {
    bonusPoints += 1.0;
    breakdown.push({ reason: "Omega-3 vorhanden", points: 1.0 });
  }

  // === LABEL BONUS ===

  const glutenFreeBonus = GLUTEN_FREE_BONUS[conditionKey];
  const hasGlutenFree = product.labels.some(
    (l) => containsIgnoreCase(l, "gluten-free") || containsIgnoreCase(l, "gluten free")
  );
  if (hasGlutenFree) {
    bonusPoints += glutenFreeBonus;
    const item: ScoreBreakdownItem = { reason: "Glutenfrei-Label", points: glutenFreeBonus };
    if (profile && glutenFreeBonus !== GLUTEN_FREE_BONUS.generic) {
      item.condition = profile.condition;
    }
    breakdown.push(item);
  }

  const bioBonus = BIO_BONUS[conditionKey];
  const hasBio = product.labels.some(
    (l) => containsIgnoreCase(l, "organic") || containsIgnoreCase(l, "bio")
  );
  if (hasBio) {
    bonusPoints += bioBonus;
    const item: ScoreBreakdownItem = { reason: "Bio-Label", points: bioBonus };
    if (profile && bioBonus !== BIO_BONUS.generic) {
      item.condition = profile.condition;
    }
    breakdown.push(item);
  }

  // === MALUS POINTS ===

  // Sugar: only the highest applicable threshold fires
  if (conditionKey !== "generic") {
    // Profile mode: check > 5g threshold too
    if ((n.sugars ?? 0) > 20) {
      const malus = SUGAR_20_MALUS[conditionKey];
      malusPoints += malus;
      const item: ScoreBreakdownItem = { reason: "Zucker > 20g/100g", points: -malus };
      if (malus !== SUGAR_20_MALUS.generic) item.condition = profile!.condition;
      breakdown.push(item);
    } else if ((n.sugars ?? 0) > 10) {
      const malus = SUGAR_10_MALUS[conditionKey];
      malusPoints += malus;
      const item: ScoreBreakdownItem = { reason: "Zucker > 10g/100g", points: -malus };
      if (malus !== SUGAR_10_MALUS.generic) item.condition = profile!.condition;
      breakdown.push(item);
    } else if ((n.sugars ?? 0) > 5) {
      const malus = SUGAR_5_MALUS[conditionKey];
      malusPoints += malus;
      // sugar > 5g threshold always gets condition set (new threshold, doesn't exist in generic)
      breakdown.push({ reason: "Zucker > 5g/100g", points: -malus, condition: profile!.condition });
    }
  } else {
    // Generic mode: only > 10g and > 20g thresholds
    if ((n.sugars ?? 0) > 20) {
      malusPoints += 2.0;
      breakdown.push({ reason: "Zucker > 20g/100g", points: -2.0 });
    } else if ((n.sugars ?? 0) > 10) {
      malusPoints += 1.0;
      breakdown.push({ reason: "Zucker > 10g/100g", points: -1.0 });
    }
  }

  if ((n.saturatedFat ?? 0) > 10) {
    malusPoints += 1.0;
    breakdown.push({ reason: "Gesättigte Fette > 10g/100g", points: -1.0 });
  }

  if ((n.salt ?? 0) > 2.5) {
    malusPoints += 1.0;
    breakdown.push({ reason: "Salz > 2.5g/100g", points: -1.0 });
  } else if ((n.salt ?? 0) > 1.5) {
    malusPoints += 0.5;
    breakdown.push({ reason: "Salz > 1.5g/100g", points: -0.5 });
  }

  // === INGREDIENTS MALUS ===

  if (containsIgnoreCase(product.ingredients, "gluten")) {
    const baseGlutenMalus = GLUTEN_MALUS[conditionKey];
    const multiplier = profile?.glutenSensitive ? 2 : 1;
    const effectiveGlutenMalus = baseGlutenMalus * multiplier;
    malusPoints += effectiveGlutenMalus;
    const item: ScoreBreakdownItem = { reason: "Gluten in Zutaten", points: -effectiveGlutenMalus };
    if (profile && (effectiveGlutenMalus !== GLUTEN_MALUS.generic)) {
      item.condition = profile.condition;
    }
    breakdown.push(item);
  }

  const hasLactose =
    containsIgnoreCase(product.ingredients, "lactose") ||
    containsIgnoreCase(product.ingredients, "milk") ||
    containsIgnoreCase(product.ingredients, "milch");

  if (hasLactose) {
    const baseLactoseMalus = 0.3;
    const multiplier = profile?.lactoseIntolerant ? 2 : 1;
    const effectiveLactoseMalus = baseLactoseMalus * multiplier;
    malusPoints += effectiveLactoseMalus;
    const item: ScoreBreakdownItem = { reason: "Laktose in Zutaten", points: -effectiveLactoseMalus };
    if (profile?.lactoseIntolerant) {
      item.condition = profile.condition;
    }
    breakdown.push(item);
  }

  if (product.additives.length > 5) {
    malusPoints += 0.5;
    breakdown.push({ reason: ">5 Zusatzstoffe", points: -0.5 });
  }

  // === FINAL SCORE ===

  let score = 3.0 + bonusPoints - malusPoints;
  score = clamp(score, 1, 5);

  let stars: 1 | 2 | 3 | 4 | 5;
  if (score >= 4.5) stars = 5;
  else if (score >= 3.5) stars = 4;
  else if (score >= 2.5) stars = 3;
  else if (score >= 1.5) stars = 2;
  else stars = 1;

  let label: ScoreResult["label"];
  if (score >= 4.5) label = "SEHR GUT";
  else if (score >= 3.5) label = "GUT";
  else if (score >= 2.5) label = "NEUTRAL";
  else if (score >= 1.5) label = "WENIGER GUT";
  else label = "VERMEIDEN";

  return {
    score: Math.round(score * 100) / 100,
    stars,
    label,
    breakdown,
    bonuses: bonusPoints,
    maluses: malusPoints,
  };
}
