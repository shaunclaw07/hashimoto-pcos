// src/core/services/scoring-service.ts
import type { Product } from "../domain/product";
import type { ScoreResult, ScoreBreakdownItem } from "../domain/score";
import type { UserProfile, Condition } from "../domain/user-profile";
import { clamp } from "../shared/math";
import { normalizeIngredientName } from "./ingredient-normalization";

/**
 * Validates nutriments and clamps them to physiologically realistic ranges.
 * Negative or unrealistically high values are corrected.
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

function containsNormalized(str: string | undefined, search: string): boolean {
  if (!str) return false;
  return normalizeIngredientName(str).includes(normalizeIngredientName(search));
}

function containsAnyNormalized(str: string | undefined, keywords: string[]): boolean {
  if (!str) return false;
  const normalized = normalizeIngredientName(str);
  return keywords.some((kw) => normalized.includes(kw));
}

// =====================================================================
// Issue #50 helpers
// =====================================================================

/**
 * Detects soy type in product.
 * Returns 'fermented' | 'non-fermented' | 'lecithin' | null
 * Fermented is hierarchical (overrides non-fermented).
 * Lecithin is independent.
 */
function detectSoyType(
  ingredients: string | undefined,
  _categories: string[]
): { type: "fermented" | "non-fermented" | "lecithin"; reason: string }[] {
  const results: { type: "fermented" | "non-fermented" | "lecithin"; reason: string }[] = [];

  // Lecithin first (independent)
  if (containsAnyNormalized(ingredients, NORM_SOY_LECITHIN_KEYWORDS)) {
    results.push({ type: "lecithin", reason: "Sojalecithin" });
  }

  // Fermented overrides non-fermented
  const hasFermented = containsAnyNormalized(ingredients, NORM_SOY_FERMENTED_KEYWORDS);
  if (hasFermented) {
    results.push({ type: "fermented", reason: "Fermentiertes Soja" });
  } else if (containsAnyNormalized(ingredients, NORM_SOY_NON_FERMENTED_KEYWORDS)) {
    results.push({ type: "non-fermented", reason: "Soja (Phytoöstrogene)" });
  }

  return results;
}

// =====================================================================
// Issue #51 helpers
// =====================================================================

type BrassicaState = "raw" | "cooked" | "unknown";

function detectBrassicaState(
  ingredients: string | undefined,
  name: string | undefined,
  categories: string[]
): BrassicaState {
  const text = normalizeIngredientName([ingredients, name].filter(Boolean).join(" "));
  const cats = categories.map((c) => normalizeIngredientName(c));

  // Check cooked first
  const isCooked =
    NORM_BRASSICA_COOKED_SIGS.some((s) => text.includes(s)) ||
    NORM_BRASSICA_COOKED_CATS.some((c) => cats.includes(c));
  if (isCooked) return "cooked";

  // Check raw
  const isRaw =
    NORM_BRASSICA_RAW_SIGNALS.some((s) => text.includes(s)) ||
    NORM_BRASSICA_RAW_CATS.some((c) => cats.includes(c));
  if (isRaw) return "raw";

  return "unknown";
}

function hasBrassica(ingredients: string | undefined, name: string | undefined, categories: string[]): boolean {
  const text = normalizeIngredientName([ingredients, name].filter(Boolean).join(" "));
  const cats = categories.map((c) => normalizeIngredientName(c));
  return (
    NORM_BRASSICA_KEYWORDS.some((kw) => text.includes(kw)) ||
    cats.some((c) => NORM_BRASSICA_KEYWORDS.some((kw) => c.includes(kw)))
  );
}

// =====================================================================
// Issue #53 helpers
// =====================================================================

type Omega3Source = "marine" | "plant" | "unknown";

function detectOmega3Source(
  ingredients: string | undefined,
  categories: string[],
  labels: string[]
): Omega3Source | null {
  const text = normalizeIngredientName(ingredients ?? "");
  const cats = categories.map((c) => normalizeIngredientName(c));
  const lbls = labels.map((l) => normalizeIngredientName(l));

  // Marine has priority
  if (NORM_OMEGA3_MARINE.some((kw) => text.includes(kw))) {
    return "marine";
  }
  // Plant-based
  if (NORM_OMEGA3_PLANT.some((kw) => text.includes(kw))) {
    return "plant";
  }
  // Label/category only (unknown source)
  if (
    lbls.some((l) => l.includes("omega")) ||
    cats.some((c) => c.includes("omega"))
  ) {
    return "unknown";
  }

  return null;
}

// =====================================================================
// Issue #54 helpers
// =====================================================================

type DairyTier = "a1-casein" | "whey" | "fermented" | "general" | "ghee" | null;

/**
 * Detects highest applicable dairy tier.
 * Hierarchical: A1-casein > Whey > Fermented > General > Ghee (neutral)
 * Returns null if no dairy detected.
 * Exceptions return null.
 */
function detectDairyTier(ingredients: string | undefined): DairyTier {
  if (!ingredients) return null;

  const normalized = normalizeIngredientName(ingredients);

  // First check exceptions
  if (NORM_DAIRY_EXCEPTIONS.some((kw) => normalized.includes(kw))) {
    return null;
  }

  if (NORM_DAIRY_A1_CASEIN.some((kw) => normalized.includes(kw))) return "a1-casein";
  if (NORM_DAIRY_WHEY.some((kw) => normalized.includes(kw))) return "whey";
  if (NORM_DAIRY_FERMENTED.some((kw) => normalized.includes(kw))) return "fermented";
  if (NORM_DAIRY_GHEE.some((kw) => normalized.includes(kw))) return "ghee";
  if (NORM_DAIRY_GENERAL.some((kw) => normalized.includes(kw))) return "general";

  return null;
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

/** Lactose ingredient malus per condition */
const LACTOSE_MALUS: Record<ConditionKey, number> = {
  generic:   0.3,
  hashimoto: 0.3,
  pcos:      0.3,
  both:      0.3,
};

// =====================================================================
// Issue #50: Soy / Phytoestrogen detection
// =====================================================================

/** Non-fermented soy malus per condition */
const SOY_NON_FERMENTED_MALUS: Record<ConditionKey, number> = {
  generic:   0,
  hashimoto: 0.8,
  pcos:      0.2,
  both:      0.8,
};

/** Soy lecithin malus per condition */
const SOY_LECITHIN_MALUS: Record<ConditionKey, number> = {
  generic:   0.1,
  hashimoto: 0.2,
  pcos:      0.2,
  both:      0.2,
};

/** Fermented soy malus per condition */
const SOY_FERMENTED_MALUS: Record<ConditionKey, number> = {
  generic:   0,
  hashimoto: 0.3,
  pcos:      0,
  both:      0.3,
};

const SOY_NON_FERMENTED_KEYWORDS = [
  "soja", "soy", "soybeans", "tofu", "sojaprotein", "soy protein",
  "soja-isolat", "soy isolate", "edamame",
];
const SOY_FERMENTED_KEYWORDS = ["tempeh", "miso"];
const SOY_LECITHIN_KEYWORDS = ["sojalecithin", "soy lecithin", "e322"];

// Pre-normalized for performance
const NORM_SOY_NON_FERMENTED_KEYWORDS = SOY_NON_FERMENTED_KEYWORDS.map(normalizeIngredientName);
const NORM_SOY_FERMENTED_KEYWORDS = SOY_FERMENTED_KEYWORDS.map(normalizeIngredientName);
const NORM_SOY_LECITHIN_KEYWORDS = SOY_LECITHIN_KEYWORDS.map(normalizeIngredientName);

// =====================================================================
// Issue #51: Goitrogen / Cruciferous vegetable warning
// =====================================================================

/** Raw brassica malus per condition */
const GOITROGEN_RAW_MALUS: Record<ConditionKey, number> = {
  generic:   0,
  hashimoto: 0.5,
  pcos:      0,
  both:      0.5,
};

const BRASSICA_KEYWORDS = [
  "broccoli", "brokkoli", "kohl", "kale", "grünkohl", "rosenkohl",
  "blumenkohl", "kohlrabi", "rucola", "rukola", "rettich", "radieschen",
  "mehrrettich", "wasabi", "senf", "mustard", "raps", "canola", "pak choi",
];
const BRASSICA_RAW_SIGNALS = ["roh", "frisch", "smoothie", "saft", "juice", "rohkost", "salat"];
const BRASSICA_RAW_CATEGORIES = ["en:fresh-vegetables", "en:juices", "en:smoothies"];
const BRASSICA_COOKED_SIGNALS = ["gegart", "gekocht", "gefroren", "gedünstet", "blanchiert"];
const BRASSICA_COOKED_CATEGORIES = ["en:frozen-vegetables", "en:cooked-vegetables"];

// Pre-normalized for performance
const NORM_BRASSICA_KEYWORDS = BRASSICA_KEYWORDS.map(normalizeIngredientName);
const NORM_BRASSICA_RAW_SIGNALS = BRASSICA_RAW_SIGNALS.map(normalizeIngredientName);
const NORM_BRASSICA_RAW_CATS = BRASSICA_RAW_CATEGORIES.map(normalizeIngredientName);
const NORM_BRASSICA_COOKED_SIGS = BRASSICA_COOKED_SIGNALS.map(normalizeIngredientName);
const NORM_BRASSICA_COOKED_CATS = BRASSICA_COOKED_CATEGORIES.map(normalizeIngredientName);

// =====================================================================
// Issue #53: Differentiated Omega-3 detection (replaces flat +1.0)
// =====================================================================

const OMEGA3_MARINE_KEYWORDS = [
  "lachs", "salmon", "makrele", "mackerel", "hering", "herring",
  "sardine", "thunfisch", "tuna", "forelle", "trout",
  "fischöl", "fish oil", "krillöl", "krill oil",
  "algenöl", "algae oil", "epa", "dha",
];
const OMEGA3_PLANT_KEYWORDS = [
  "leinsamen", "linseed", "flaxseed", "leinöl", "linseed oil",
  "chiasamen", "chia seeds", "hanföl", "hemp oil",
  "walnuss", "walnut", "rapsöl", "canola oil", "ala",
];

// Pre-normalized for performance
const NORM_OMEGA3_MARINE = OMEGA3_MARINE_KEYWORDS.map(normalizeIngredientName);
const NORM_OMEGA3_PLANT = OMEGA3_PLANT_KEYWORDS.map(normalizeIngredientName);

// =====================================================================
// Issue #54: Tiered dairy detection
// =====================================================================

/** A1-Casein malus per condition */
const DAIRY_A1_CASEIN_MALUS: Record<ConditionKey, number> = {
  generic:   0.3,
  hashimoto: 0.5,
  pcos:      0.3,
  both:      0.5,
};

/** Whey malus per condition */
const DAIRY_WHEY_MALUS: Record<ConditionKey, number> = {
  generic:   0.3,
  hashimoto: 0.3,
  pcos:      0.3,
  both:      0.3,
};

/** Fermented dairy malus per condition */
const DAIRY_FERMENTED_MALUS: Record<ConditionKey, number> = {
  generic:   0.1,
  hashimoto: 0.2,
  pcos:      0.1,
  both:      0.2,
};

/** General dairy malus per condition */
const DAIRY_GENERAL_MALUS: Record<ConditionKey, number> = {
  generic:   0.3,
  hashimoto: 0.3,
  pcos:      0.3,
  both:      0.3,
};

const DAIRY_A1_CASEIN_KEYWORDS = [
  "casein", "caseinat", "natriumcaseinat", "kaliumcaseinat",
  "calcium caseinate", "casein hydrolysate", "micellar casein",
];
const DAIRY_WHEY_KEYWORDS = [
  "whey", "molke", "molkenprotein", "whey protein",
  "whey concentrate", "whey isolate", "lactalbumin", "lactoglobulin",
];
const DAIRY_FERMENTED_KEYWORDS = ["kefir", "joghurt", "yogurt", "yoghurt"];
const DAIRY_GENERAL_KEYWORDS = [
  "milk", "milch", "vollmilch", "magermilch", "buttermilk",
  "sahne", "rahm", "cream", "butter", "käse", "cheese", "quark",
  "lactose", "laktose", "milchzucker",
];
const DAIRY_GHEE_KEYWORDS = ["ghee"];
const DAIRY_EXCEPTION_KEYWORDS = ["milchsäure", "lactic acid", "calciumlactat", "calcium lactate"];

// Pre-normalized for performance
const NORM_DAIRY_A1_CASEIN = DAIRY_A1_CASEIN_KEYWORDS.map(normalizeIngredientName);
const NORM_DAIRY_WHEY = DAIRY_WHEY_KEYWORDS.map(normalizeIngredientName);
const NORM_DAIRY_FERMENTED = DAIRY_FERMENTED_KEYWORDS.map(normalizeIngredientName);
const NORM_DAIRY_GHEE = DAIRY_GHEE_KEYWORDS.map(normalizeIngredientName);
const NORM_DAIRY_GENERAL = DAIRY_GENERAL_KEYWORDS.map(normalizeIngredientName);
const NORM_DAIRY_EXCEPTIONS = DAIRY_EXCEPTION_KEYWORDS.map(normalizeIngredientName);

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
    // fiberMidBonus is identical across all conditions; no condition tag needed
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

  // Issue #53: Differentiated Omega-3 detection
  const omega3Source = detectOmega3Source(
    product.ingredients,
    product.categories,
    product.labels
  );
  if (omega3Source === "marine") {
    bonusPoints += 1.5;
    breakdown.push({ reason: "Omega-3 (EPA/DHA, mariner Ursprung)", points: 1.5 });
  } else if (omega3Source === "plant") {
    bonusPoints += 0.5;
    breakdown.push({ reason: "Omega-3 (ALA, pflanzlicher Ursprung)", points: 0.5 });
  } else if (omega3Source === "unknown") {
    bonusPoints += 0.7;
    breakdown.push({ reason: "Omega-3 (Quelle unbekannt)", points: 0.7 });
  }

  // === LABEL BONUS ===

  const glutenFreeBonus = GLUTEN_FREE_BONUS[conditionKey];
  const hasGlutenFree = product.labels.some(
    (l) => containsNormalized(l, "gluten-free") || containsNormalized(l, "gluten free")
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
    (l) => containsNormalized(l, "organic") || containsNormalized(l, "bio")
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
  const sugar = n.sugars ?? 0;
  if (sugar > 20) {
    const malus = SUGAR_20_MALUS[conditionKey];
    malusPoints += malus;
    const item: ScoreBreakdownItem = { reason: "Zucker > 20g/100g", points: -malus };
    if (profile && malus !== SUGAR_20_MALUS.generic) item.condition = profile.condition;
    breakdown.push(item);
  } else if (sugar > 10) {
    const malus = SUGAR_10_MALUS[conditionKey];
    malusPoints += malus;
    const item: ScoreBreakdownItem = { reason: "Zucker > 10g/100g", points: -malus };
    if (profile && malus !== SUGAR_10_MALUS.generic) item.condition = profile.condition;
    breakdown.push(item);
  } else if (sugar > 5 && conditionKey !== "generic") {
    const malus = SUGAR_5_MALUS[conditionKey];
    malusPoints += malus;
    breakdown.push({ reason: "Zucker > 5g/100g", points: -malus, condition: profile!.condition });
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

  if (containsNormalized(product.ingredients, "gluten")) {
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

  // Issue #50: Soy / Phytoestrogen detection
  const soyTypes = detectSoyType(product.ingredients, product.categories);
  for (const soy of soyTypes) {
    const malus =
      soy.type === "non-fermented"
        ? SOY_NON_FERMENTED_MALUS[conditionKey]
        : soy.type === "fermented"
        ? SOY_FERMENTED_MALUS[conditionKey]
        : SOY_LECITHIN_MALUS[conditionKey];

    if (malus !== 0) {
      malusPoints += malus;
      const item: ScoreBreakdownItem = { reason: soy.reason, points: -malus };
      if (profile && malus !== (soy.type === "non-fermented" ? SOY_NON_FERMENTED_MALUS.generic : soy.type === "fermented" ? SOY_FERMENTED_MALUS.generic : SOY_LECITHIN_MALUS.generic)) {
        item.condition = profile.condition;
      }
      breakdown.push(item);
    }
  }

  // Issue #51: Goitrogen warning for cruciferous vegetables
  const hasBrassicaResult = hasBrassica(product.ingredients, product.name, product.categories);
  if (hasBrassicaResult) {
    const state = detectBrassicaState(product.ingredients, product.name, product.categories);
    if (state === "raw") {
      const malus = GOITROGEN_RAW_MALUS[conditionKey];
      malusPoints += malus;
      const item: ScoreBreakdownItem = { reason: "Kreuzblütler (roh, Goitrogene)", points: -malus };
      if (profile && malus !== GOITROGEN_RAW_MALUS.generic) {
        item.condition = profile.condition;
      }
      breakdown.push(item);
    } else if (state === "unknown") {
      // Informational: 0 points but shown in breakdown
      breakdown.push({ reason: "Kreuzblütler (Zubereitungsart unbekannt)", points: 0 });
    }
    // Cooked: no penalty, no breakdown item
  }

  // Issue #54: Tiered dairy detection
  const dairyTier = detectDairyTier(product.ingredients);
  if (dairyTier && dairyTier !== "ghee") {
    const baseDairyMalus =
      dairyTier === "a1-casein"
        ? DAIRY_A1_CASEIN_MALUS[conditionKey]
        : dairyTier === "whey"
        ? DAIRY_WHEY_MALUS[conditionKey]
        : dairyTier === "fermented"
        ? DAIRY_FERMENTED_MALUS[conditionKey]
        : DAIRY_GENERAL_MALUS[conditionKey];

    const multiplier = profile?.lactoseIntolerant ? 2 : 1;
    const effectiveMalus = baseDairyMalus * multiplier;
    malusPoints += effectiveMalus;

    const reasonMap: Record<string, string> = {
      "a1-casein": "Casein (A1, entzündungsrelevant)",
      whey: "Molkenprotein (Whey)",
      fermented: "Fermentierte Milchprodukte",
      general: "Milchbestandteile",
    };
    const item: ScoreBreakdownItem = {
      reason: reasonMap[dairyTier] ?? "Milchbestandteile",
      points: -effectiveMalus,
    };
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
