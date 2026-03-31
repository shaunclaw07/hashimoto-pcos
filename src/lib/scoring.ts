import type { OpenFoodFactsProduct } from './openfoodfacts';

/**
 * Score breakdown item explaining a single bonus or malus
 */
export interface ScoreBreakdownItem {
  reason: string;
  points: number;
}

/**
 * Result of the scoring calculation
 */
export interface ScoreResult {
  score: number;
  stars: number;
  label: 'SEHR GUT' | 'GUT' | 'NEUTRAL' | 'WENIGER GUT' | 'VERMEIDEN';
  breakdown: ScoreBreakdownItem[];
  bonuses: number;
  maluses: number;
}

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Checks if a string contains a substring (case-insensitive)
 */
function containsIgnoreCase(str: string | undefined, search: string): boolean {
  if (!str) return false;
  return str.toLowerCase().includes(search.toLowerCase());
}

/**
 * Calculates the health score for a product based on nutritional values,
 * labels, and ingredients.
 * 
 * Score = 3.0 (Startwert: Neutral)
 *         + Bonus_Punkte
 *         - Malus_Punkte
 *         + Label_Bonus
 *         - Ingredients_Malus
 * 
 * Clamped between 1 and 5
 */
export function calculateScore(product: OpenFoodFactsProduct): ScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let bonusPoints = 0;
  let malusPoints = 0;

  const nutriments = product.nutriments || {};

  // === BONUS POINTS ===

  // Ballaststoffe > 6g/100g → +1.0
  if ((nutriments.fiber_100g ?? 0) > 6) {
    bonusPoints += 1.0;
    breakdown.push({ reason: 'Ballaststoffe > 6g/100g', points: 1.0 });
  }
  // Ballaststoffe > 3g/100g → +0.5
  else if ((nutriments.fiber_100g ?? 0) > 3) {
    bonusPoints += 0.5;
    breakdown.push({ reason: 'Ballaststoffe > 3g/100g', points: 0.5 });
  }

  // Protein > 20g/100g → +0.5
  if ((nutriments.proteins_100g ?? 0) > 20) {
    bonusPoints += 0.5;
    breakdown.push({ reason: 'Protein > 20g/100g', points: 0.5 });
  }

  // Omega-3 > 1g/100g → +1.0 (search in categories or labels)
  const hasOmega3 = 
    containsIgnoreCase(product.categories, 'omega-3') ||
    containsIgnoreCase(product.categories, 'omega 3') ||
    containsIgnoreCase(product.labels, 'omega-3') ||
    containsIgnoreCase(product.labels, 'omega 3');
  
  if (hasOmega3) {
    bonusPoints += 1.0;
    breakdown.push({ reason: 'Omega-3 vorhanden', points: 1.0 });
  }

  // === LABEL BONUS ===

  // Glutenfrei-Label → +0.5
  if (containsIgnoreCase(product.labels, 'gluten-free') || 
      containsIgnoreCase(product.labels, 'gluten free')) {
    bonusPoints += 0.5;
    breakdown.push({ reason: 'Glutenfrei-Label', points: 0.5 });
  }

  // Bio-Label → +0.5
  if (containsIgnoreCase(product.labels, 'organic') || 
      containsIgnoreCase(product.labels, 'bio')) {
    bonusPoints += 0.5;
    breakdown.push({ reason: 'Bio-Label', points: 0.5 });
  }

  // === MALUS POINTS ===

  // Zucker > 20g/100g → -2.0
  if ((nutriments.sugars_100g ?? 0) > 20) {
    malusPoints += 2.0;
    breakdown.push({ reason: 'Zucker > 20g/100g', points: -2.0 });
  }
  // Zucker > 10g/100g → -1.0
  else if ((nutriments.sugars_100g ?? 0) > 10) {
    malusPoints += 1.0;
    breakdown.push({ reason: 'Zucker > 10g/100g', points: -1.0 });
  }

  // Gesättigte Fette > 10g/100g → -1.0
  if ((nutriments['saturated-fat_100g'] ?? 0) > 10) {
    malusPoints += 1.0;
    breakdown.push({ reason: 'Gesättigte Fette > 10g/100g', points: -1.0 });
  }

  // Salz > 2.5g/100g → -1.0
  if ((nutriments.salt_100g ?? 0) > 2.5) {
    malusPoints += 1.0;
    breakdown.push({ reason: 'Salz > 2.5g/100g', points: -1.0 });
  }
  // Salz > 1.5g/100g → -0.5
  else if ((nutriments.salt_100g ?? 0) > 1.5) {
    malusPoints += 0.5;
    breakdown.push({ reason: 'Salz > 1.5g/100g', points: -0.5 });
  }

  // Trans-Fette → -2.0 (OpenFoodFacts hat kein direktes Feld - ignoriert)

  // === INGREDIENTS MALUS ===

  // Gluten in Zutaten → -0.5
  if (containsIgnoreCase(product.ingredients_text, 'gluten')) {
    malusPoints += 0.5;
    breakdown.push({ reason: 'Gluten in Zutaten', points: -0.5 });
  }

  // Laktose in Zutaten → -0.3
  if (containsIgnoreCase(product.ingredients_text, 'lactose') ||
      containsIgnoreCase(product.ingredients_text, 'milk') ||
      containsIgnoreCase(product.ingredients_text, 'milch')) {
    malusPoints += 0.3;
    breakdown.push({ reason: 'Laktose in Zutaten', points: -0.3 });
  }

  // >5 Zusatzstoffe → -0.5
  if ((product.additives?.length ?? 0) > 5) {
    malusPoints += 0.5;
    breakdown.push({ reason: '>5 Zusatzstoffe', points: -0.5 });
  }

  // === CALCULATE FINAL SCORE ===

  const baseScore = 3.0;
  let score = baseScore + bonusPoints - malusPoints;

  // Clamp between 1 and 5
  score = clamp(score, 1, 5);

  // Calculate stars (1-5)
  let stars: number;
  if (score >= 4.5) stars = 5;
  else if (score >= 3.5) stars = 4;
  else if (score >= 2.5) stars = 3;
  else if (score >= 1.5) stars = 2;
  else stars = 1;

  // Determine label
  let label: ScoreResult['label'];
  if (score >= 4.5) label = 'SEHR GUT';
  else if (score >= 3.5) label = 'GUT';
  else if (score >= 2.5) label = 'NEUTRAL';
  else if (score >= 1.5) label = 'WENIGER GUT';
  else label = 'VERMEIDEN';

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    stars,
    label,
    breakdown,
    bonuses: bonusPoints,
    maluses: malusPoints,
  };
}
