// src/core/services/scoring-service.ts
import type { Product } from "../domain/product";
import type { ScoreResult, ScoreBreakdownItem } from "../domain/score";
import type { UserProfile } from "../domain/user-profile";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function containsIgnoreCase(str: string | undefined, search: string): boolean {
  if (!str) return false;
  return str.toLowerCase().includes(search.toLowerCase());
}

/**
 * Calculates health score for a product (1.0–5.0).
 * _profile is reserved for Phase 2 personalization — currently unused.
 */
export function calculateScore(product: Product, _profile?: UserProfile): ScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let bonusPoints = 0;
  let malusPoints = 0;

  const n = product.nutriments;

  // === BONUS POINTS ===

  if ((n.fiber ?? 0) > 6) {
    bonusPoints += 1.0;
    breakdown.push({ reason: "Ballaststoffe > 6g/100g", points: 1.0 });
  } else if ((n.fiber ?? 0) > 3) {
    bonusPoints += 0.5;
    breakdown.push({ reason: "Ballaststoffe > 3g/100g", points: 0.5 });
  }

  if ((n.protein ?? 0) > 20) {
    bonusPoints += 0.5;
    breakdown.push({ reason: "Protein > 20g/100g", points: 0.5 });
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

  const hasGlutenFree = product.labels.some(
    (l) => containsIgnoreCase(l, "gluten-free") || containsIgnoreCase(l, "gluten free")
  );
  if (hasGlutenFree) {
    bonusPoints += 0.5;
    breakdown.push({ reason: "Glutenfrei-Label", points: 0.5 });
  }

  const hasBio = product.labels.some(
    (l) => containsIgnoreCase(l, "organic") || containsIgnoreCase(l, "bio")
  );
  if (hasBio) {
    bonusPoints += 0.5;
    breakdown.push({ reason: "Bio-Label", points: 0.5 });
  }

  // === MALUS POINTS ===

  if ((n.sugars ?? 0) > 20) {
    malusPoints += 2.0;
    breakdown.push({ reason: "Zucker > 20g/100g", points: -2.0 });
  } else if ((n.sugars ?? 0) > 10) {
    malusPoints += 1.0;
    breakdown.push({ reason: "Zucker > 10g/100g", points: -1.0 });
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
    malusPoints += 0.5;
    breakdown.push({ reason: "Gluten in Zutaten", points: -0.5 });
  }

  if (
    containsIgnoreCase(product.ingredients, "lactose") ||
    containsIgnoreCase(product.ingredients, "milk") ||
    containsIgnoreCase(product.ingredients, "milch")
  ) {
    malusPoints += 0.3;
    breakdown.push({ reason: "Laktose in Zutaten", points: -0.3 });
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
