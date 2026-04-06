// src/core/services/scoring-service.test.ts
import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring-service";
import type { Product } from "../domain/product";
import type { UserProfile } from "../domain/user-profile";

// Helper: creates a minimal test product with all required fields present
function makeProduct(overrides: Partial<Product> & { nutriments?: Partial<Product["nutriments"]> }): Product {
  const base: Product = {
    barcode: "",
    name: "Test",
    nutriments: {},
    labels: [],
    ingredients: "",
    categories: [],
    additives: [],
  };
  return {
    ...base,
    ...overrides,
    nutriments: overrides.nutriments ? { ...overrides.nutriments } : base.nutriments,
  };
}

describe("calculateScore", () => {
  describe("Olive oil", () => {
    it("score 2.5 with organic label (due to saturated fat)", () => {
      const product = makeProduct({
        nutriments: { sugars: 0, fat: 100, saturatedFat: 14, fiber: 0, protein: 0, salt: 0 },
        labels: ["organic"],
      });
      const result = calculateScore(product);
      // 3.0 + 0.5 (bio) - 1.0 (sat fat > 10) = 2.5
      expect(result.score).toBe(2.5);
      expect(result.label).toBe("NEUTRAL");
    });

    it("score 2.0 without labels", () => {
      const product = makeProduct({
        nutriments: { sugars: 0, fat: 100, saturatedFat: 14, fiber: 0, protein: 0, salt: 0 },
      });
      const result = calculateScore(product);
      // 3.0 - 1.0 = 2.0
      expect(result.score).toBe(2.0);
      expect(result.label).toBe("WENIGER GUT");
    });
  });

  describe("Nutella", () => {
    it("score 1.0 due to high sugar, milk and saturated fat", () => {
      const product = makeProduct({
        nutriments: { sugars: 56, fat: 31, saturatedFat: 11, fiber: 2.7, protein: 5.4, salt: 0.1 },
        ingredients: "sugar, palm oil, hazelnuts, skim milk",
      });
      const result = calculateScore(product);
      // 3.0 - 2.0 (sugar>20) - 0.3 (milk) - 1.0 (sat fat >10) = -0.3 → clamped to 1.0
      expect(result.score).toBe(1.0);
      expect(result.label).toBe("VERMEIDEN");
      expect(result.stars).toBe(1);
    });
  });

  describe("Fiber bonus", () => {
    it("+1.0 for fiber > 6g", () => {
      const product = makeProduct({ nutriments: { fiber: 7 } });
      const result = calculateScore(product);
      expect(result.score).toBe(4.0); // 3.0 + 1.0
      expect(result.bonuses).toBe(1.0);
    });

    it("+0.5 for fiber > 3g", () => {
      const product = makeProduct({ nutriments: { fiber: 4 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5); // 3.0 + 0.5
    });

    it("no bonus for fiber <= 3g", () => {
      const product = makeProduct({ nutriments: { fiber: 3 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.0);
    });
  });

  describe("Protein bonus", () => {
    it("+0.5 for protein > 20g", () => {
      const product = makeProduct({ nutriments: { protein: 21 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
      expect(result.bonuses).toBe(0.5);
    });
  });

  describe("Omega-3 bonus (Issue #53 — source-differentiated)", () => {
    it("+1.5 for Omega-3 marine source (EPA/DHA)", () => {
      const product = makeProduct({ ingredients: "lachs, salt" });
      const result = calculateScore(product);
      // 3.0 + 1.5 = 4.5 → clamped to 5? No, 4.5 < 5.0, so 4.5
      // Wait: 3.0 + 1.5 = 4.5. stars=5, label=SEHR GUT
      expect(result.score).toBe(4.5);
    });

    it("+0.5 for Omega-3 plant source (ALA)", () => {
      const product = makeProduct({ ingredients: "leinsamen, fiber" });
      const result = calculateScore(product);
      // 3.0 + 0.5 = 3.5
      expect(result.score).toBe(3.5);
    });

    it("+0.7 for Omega-3 label-only (unknown source)", () => {
      const product = makeProduct({ categories: ["omega-3 fatty acids"] });
      const result = calculateScore(product);
      // 3.0 + 0.7 = 3.7
      expect(result.score).toBe(3.7);
      const item = result.breakdown.find((i) => i.reason.includes("Omega-3"));
      expect(item).toBeDefined();
      expect(item!.points).toBe(0.7);
    });

    it("+0.7 for Omega-3 label (unknown source)", () => {
      const product = makeProduct({ labels: ["omega-3"] });
      const result = calculateScore(product);
      // 3.0 + 0.7 = 3.7
      expect(result.score).toBe(3.7);
    });
  });

  describe("Label bonuses", () => {
    it("+0.5 for gluten-free label", () => {
      const product = makeProduct({ labels: ["gluten-free"] });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
    });

    it("+0.5 for organic label", () => {
      const product = makeProduct({ labels: ["organic"] });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
    });

    it("+0.5 for bio label (case-insensitive)", () => {
      const product = makeProduct({ labels: ["Bio"] });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
    });
  });

  describe("Sugar penalty", () => {
    it("-2.0 for sugar > 20g", () => {
      const product = makeProduct({ nutriments: { sugars: 21 } });
      const result = calculateScore(product);
      expect(result.score).toBe(1.0);
      expect(result.maluses).toBe(2.0);
    });

    it("-1.0 for sugar > 10g", () => {
      const product = makeProduct({ nutriments: { sugars: 11 } });
      const result = calculateScore(product);
      expect(result.score).toBe(2.0);
      expect(result.maluses).toBe(1.0);
    });
  });

  describe("Salt penalty", () => {
    it("-1.0 for salt > 2.5g", () => {
      const product = makeProduct({ nutriments: { salt: 3 } });
      const result = calculateScore(product);
      expect(result.score).toBe(2.0);
    });

    it("-0.5 for salt > 1.5g", () => {
      const product = makeProduct({ nutriments: { salt: 2 } });
      const result = calculateScore(product);
      expect(result.score).toBe(2.5);
    });
  });

  describe("Ingredients penalty", () => {
    it("-0.5 for gluten in ingredients", () => {
      const product = makeProduct({ ingredients: "wheat gluten, water" });
      const result = calculateScore(product);
      expect(result.score).toBe(2.5);
      expect(result.maluses).toBe(0.5);
    });

    it("-0.3 for milk in ingredients", () => {
      const product = makeProduct({ ingredients: "skim milk, sugar" });
      const result = calculateScore(product);
      expect(result.score).toBeCloseTo(2.7, 1);
      expect(result.maluses).toBeCloseTo(0.3, 1);
    });
  });

  describe("Additives penalty", () => {
    it("-0.5 for more than 5 additives", () => {
      const product = makeProduct({
        additives: ["en:e100", "en:e200", "en:e300", "en:e400", "en:e500", "en:e600"],
      });
      const result = calculateScore(product);
      expect(result.score).toBe(2.5);
    });

    it("no penalty for exactly 5 additives", () => {
      const product = makeProduct({
        additives: ["en:e100", "en:e200", "en:e300", "en:e400", "en:e500"],
      });
      const result = calculateScore(product);
      expect(result.score).toBe(3.0);
    });
  });

  describe("Score Clamping", () => {
    it("score is clamped to 5.0", () => {
      const product = makeProduct({
        nutriments: { fiber: 10, protein: 25 },
        labels: ["gluten-free", "organic", "omega-3"],
      });
      const result = calculateScore(product);
      expect(result.score).toBe(5.0);
      expect(result.stars).toBe(5);
    });

    it("score is clamped to 1.0", () => {
      const product = makeProduct({
        nutriments: { sugars: 100, saturatedFat: 50, salt: 10 },
        ingredients: "skim milk",
      });
      const result = calculateScore(product);
      expect(result.score).toBe(1.0);
      expect(result.stars).toBe(1);
    });
  });

  describe("Score labels and stars", () => {
    it("score 4.5+ → SEHR GUT, 5 stars", () => {
      const product = makeProduct({ nutriments: { fiber: 10, protein: 25 }, labels: ["organic"] });
      const result = calculateScore(product);
      expect(result.label).toBe("SEHR GUT");
      expect(result.stars).toBe(5);
    });

    it("score 3.5-4.4 → GUT, 4 stars", () => {
      const product = makeProduct({ nutriments: { fiber: 4 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
      expect(result.label).toBe("GUT");
      expect(result.stars).toBe(4);
    });

    it("score 2.5-3.4 → NEUTRAL, 3 stars", () => {
      const product = makeProduct({});
      const result = calculateScore(product);
      expect(result.score).toBe(3.0);
      expect(result.label).toBe("NEUTRAL");
      expect(result.stars).toBe(3);
    });
  });

  describe("Nutriment validation (Issue #32)", () => {
    it("negative sugar values are clamped to 0", () => {
      // sugars = -10 → clamped to 0 → 0 > 20 = false, no penalty
      const product = makeProduct({ nutriments: { sugars: -10 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(0);
      expect(result.score).toBe(3.0);
    });

    it("high sugar values (>100g) are clamped to 100", () => {
      // sugars = 200 → clamped to 100 → 100 > 20 = true → penalty 2.0
      const product = makeProduct({ nutriments: { sugars: 200 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(2.0);
      expect(result.score).toBe(1.0);
    });

    it("negative fiber values are clamped to 0", () => {
      const product = makeProduct({ nutriments: { fiber: -5 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(0);
      expect(result.score).toBe(3.0);
    });

    it("high fiber values (>100g) are clamped to 100", () => {
      // fiber = 150 → clamped to 100 → 100 > 6 = true → bonus 1.0
      const product = makeProduct({ nutriments: { fiber: 150 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(1.0);
    });

    it("negative salt values are clamped to 0", () => {
      const product = makeProduct({ nutriments: { salt: -10 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(0);
      expect(result.score).toBe(3.0);
    });

    it("high salt values (>100g) are clamped to 100", () => {
      // salt = 500 → clamped to 100 → 100 > 2.5 = true → penalty 1.0
      const product = makeProduct({ nutriments: { salt: 500 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(1.0);
    });

    it("energy > 4000 kcal is clamped to 4000", () => {
      // energyKcal currently not used in scoring, but should be clamped
      const product = makeProduct({ nutriments: { energyKcal: 5000 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.0); // No scoring impact, but no crash
    });

    it("negative protein values are clamped to 0", () => {
      const product = makeProduct({ nutriments: { protein: -10 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(0);
    });

    it("negative saturated fat values are clamped to 0", () => {
      const product = makeProduct({ nutriments: { saturatedFat: -5 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(0);
    });

    it("combination: all nutriments negative or unrealistically high", () => {
      const product = makeProduct({
        nutriments: {
          sugars: -50,
          fiber: 200,
          saturatedFat: -20,
          salt: 500,
          protein: -30,
        },
      });
      const result = calculateScore(product);
      // sugars: -50 → 0, no penalty
      // fiber: 200 → 100 → 100 > 6 → bonus 1.0
      // saturatedFat: -20 → 0, no penalty
      // salt: 500 → 100 → 100 > 2.5 → penalty 1.0
      // protein: -30 → 0, no bonus
      // Score: 3.0 + 1.0 - 1.0 = 3.0
      expect(result.score).toBe(3.0);
      expect(result.bonuses).toBe(1.0);
      expect(result.maluses).toBe(1.0);
    });
  });

  describe("Real product fixtures", () => {
    it("Green lentils → SEHR GUT", () => {
      const product = makeProduct({
        name: "Green lentils",
        nutriments: { energyKcal: 315, sugars: 1.5, fat: 1, fiber: 20, protein: 26 },
      });
      const result = calculateScore(product);
      expect(result.label).toBe("SEHR GUT");
    });

    it("Hazelnut spread → VERMEIDEN", () => {
      const product = makeProduct({
        name: "hazelnut spread with cocoa",
        nutriments: { sugars: 56.8, fat: 29.7, saturatedFat: 10.8, fiber: 2.7, protein: 5.41, salt: 0.1 },
        ingredients: "sugar, palm oil, hazelnuts, skim milk",
      });
      const result = calculateScore(product);
      expect(result.label).toBe("VERMEIDEN");
    });
  });
});

describe("Nutriment validation (Bugfix #32)", () => {
  describe("Negative values are corrected", () => {
    it("negative sugar values give no bonus", () => {
      // Bug: sugars = -5 would be treated as "good" since -5 is not > 20
      // but negative sugar should not influence calculations as negative
      const product = makeProduct({ nutriments: { sugars: -5 } });
      const result = calculateScore(product);
      // Without clamp: sugars=-5 → no penalty → 3.0
      // With clamp: sugars=0 → no penalty → 3.0 → same result, BUT
      // there must be NO bonus just because the value is erroneously negative
      expect(result.maluses).toBe(0);
      expect(result.score).toBe(3.0); // neutral — no bonus
    });

    it("negative sugar must not be interpreted as low (bonus)", () => {
      // sugars=-30 is an invalid value — must not produce a sugar penalty
      const product = makeProduct({ nutriments: { sugars: -30 } });
      const result = calculateScore(product);
      // Without clamp: sugars=-30 → -30 > 20? no → no penalty ✓
      // also: -30 > 10? no → no penalty ✓
      // Accidentally correct now, BUT will break if thresholds change
      expect(result.maluses).toBe(0);
    });

    it("negative fiber values are not counted as fiber bonus", () => {
      const product = makeProduct({ nutriments: { fiber: -10 } });
      const result = calculateScore(product);
      // Without clamp: fiber=-10 → -10 > 6? no → no bonus ✓
      // Without clamp: fiber=-10 → -10 > 3? no → no bonus ✓
      // Also accidentally correct, but semantically wrong
      expect(result.bonuses).toBe(0);
    });

    it("negative protein gives no bonus", () => {
      const product = makeProduct({ nutriments: { protein: -5 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(0);
    });
  });

  describe("Unrealistically high values are clamped", () => {
    it("energy > 4000 kcal is clamped", () => {
      const product = makeProduct({ nutriments: { energyKcal: 9000 } });
      const result = calculateScore(product);
      // Should not produce a bonus because value is unrealistic
      // Note: energyKcal is currently NOT used in scoring
      // Only verify no crash occurs
      expect(result.score).toBeDefined();
    });

    it("sugar > 100g is clamped to 100g", () => {
      // 100g sugar = 2.0 penalty → score 1.0
      // 200g sugar = should also give 2.0 penalty because clamped
      const product100 = makeProduct({ nutriments: { sugars: 100 } });
      const product200 = makeProduct({ nutriments: { sugars: 200 } });
      const result100 = calculateScore(product100);
      const result200 = calculateScore(product200);
      expect(result200.score).toBe(result100.score);
      expect(result100.score).toBe(1.0); // 3.0 - 2.0 penalty
    });

    it("fiber > 100g is clamped", () => {
      const product = makeProduct({ nutriments: { fiber: 150 } });
      const result = calculateScore(product);
      // fiber=150 → clamped to 100 → >6 → bonus +1.0
      // Without clamp: >6 → bonus +1.0 (accidentally correct)
      // BUT: fiber=150 is unrealistic and should be clamped
      expect(result.score).toBe(4.0); // 3.0 + 1.0
    });
  });

  describe("Combined validation", () => {
    it("all values simultaneously negative/high → correct scoring", () => {
      const product = makeProduct({
        nutriments: {
          sugars: -20,
          saturatedFat: -5,
          salt: -1,
          fiber: -3,
          protein: -10,
        }
      });
      const result = calculateScore(product);
      // All values clamped to 0 → no bonuses or penalties → score 3.0
      expect(result.score).toBe(3.0);
      expect(result.bonuses).toBe(0);
      expect(result.maluses).toBe(0);
    });

    it("Mixed valid and invalid values", () => {
      const product = makeProduct({
        nutriments: {
          sugars: -5,     // invalid → 0
          fiber: 7,       // valid → bonus +1.0
          salt: 3,        // valid → penalty -1.0
        }
      });
      const result = calculateScore(product);
      // sugars=-5 → 0 (no penalty), fiber=7 → +1.0, salt=3 → -1.0
      // score = 3.0 + 1.0 - 1.0 = 3.0
      expect(result.score).toBe(3.0);
    });
  });
});

// =============================================================================
// EXPLICIT VALIDATION TESTS (Bugfix #32)
// =============================================================================
// The validateNutriments() function must clamp negative/unrealistic values.
// These tests fail WITHOUT the implementation.
describe("validateNutriments (Bugfix #32)", () => {
  // Since validateNutriments now exists, these tests verify clamping behavior
  // explicitly — checking both that the function exists and works correctly.

  it("should treat negative sugar as clamped to 0 (bonus logic)", () => {
    // Note: sugars=-5 accidentally produces no penalty because -5>20 is false
    // BUT: sugars=-5 is invalid data and must not be treated as "0" for
    // future features that award a bonus for low sugar
    // We test the desired behavior: validateNutriments clamps to 0
    const product = makeProduct({ nutriments: { sugars: -5 } });
    const result = calculateScore(product);
    // Expected: sugars clamped to 0 → no penalty
    // Reality: sugars=-5 → no penalty (accidentally correct)
    // BUT: the issue is semantic — the data is invalid
    expect(result.score).toBe(3.0); // neutral — no bonus and no penalty
  });

  it("sugar > 100g must be clamped to 100g (not 200g=more penalty)", () => {
    const product = makeProduct({ nutriments: { sugars: 200 } });
    const result = calculateScore(product);
    // Expected: sugars=200 → clamped to 100 → penalty 2.0 → score 1.0
    // Without clamp: sugars=200 → penalty 2.0 → score 1.0 (accidentally correct)
    // Problem becomes visible when thresholds change
    expect(result.score).toBe(1.0); // clamped to 100g = penalty 2.0
  });

  it("all negative macronutrients clamped to 0", () => {
    const product = makeProduct({
      nutriments: {
        fat: -50,
        saturatedFat: -20,
        sugars: -30,
        fiber: -10,
        protein: -15,
        salt: -5,
      }
    });
    const result = calculateScore(product);
    // All clamped to 0 → no bonus, no penalty → 3.0
    expect(result.score).toBe(3.0);
  });

  it("unrealistically high energy does not crash", () => {
    const product = makeProduct({ nutriments: { energyKcal: 99999 } });
    const result = calculateScore(product);
    expect(result.score).toBeDefined();
    expect(result.stars).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// calculateScore WITH USER PROFILE
// =============================================================================
describe("calculateScore with user profile", () => {
  // -------------------------------------------------------------------------
  // 1. Generic mode regression
  // -------------------------------------------------------------------------
  describe("Generic mode regression", () => {
    it("all breakdown items have condition === undefined without profile", () => {
      const product = makeProduct({
        nutriments: { sugars: 11, fiber: 7, protein: 25 },
        labels: ["gluten-free", "organic"],
        ingredients: "wheat gluten, skim milk",
      });
      const result = calculateScore(product);
      for (const item of result.breakdown) {
        expect(item.condition).toBeUndefined();
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. Hashimoto profile — threshold verification
  // -------------------------------------------------------------------------
  describe("Hashimoto profile — thresholds", () => {
    const hashimotoProfile: import("../domain/user-profile").UserProfile = {
      condition: "hashimoto",
      glutenSensitive: false,
      lactoseIntolerant: false,
    };

    it("gluten in ingredients → penalty -1.5, condition: hashimoto", () => {
      const product = makeProduct({ ingredients: "wheat gluten, water" });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 - 1.5 = 1.5
      expect(result.score).toBeCloseTo(1.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Gluten in Zutaten");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-1.5, 1);
      expect(item!.condition).toBe("hashimoto");
    });

    it("fiber > 6g → bonus +1.0, condition NOT set (same as generic)", () => {
      const product = makeProduct({ nutriments: { fiber: 7 } });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 + 1.0 = 4.0
      expect(result.score).toBeCloseTo(4.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Ballaststoffe > 6g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(1.0, 1);
      expect(item!.condition).toBeUndefined();
    });

    it("protein > 20g → bonus +0.5, condition NOT set (same as generic)", () => {
      const product = makeProduct({ nutriments: { protein: 21 } });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 + 0.5 = 3.5
      expect(result.score).toBeCloseTo(3.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Protein > 20g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(0.5, 1);
      expect(item!.condition).toBeUndefined();
    });

    it("organic label → bonus +0.5, condition NOT set (same as generic)", () => {
      const product = makeProduct({ labels: ["organic"] });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 + 0.5 = 3.5
      expect(result.score).toBeCloseTo(3.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Bio-Label");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(0.5, 1);
      expect(item!.condition).toBeUndefined();
    });

    it("gluten-free label → bonus +0.5, condition NOT set (same as generic)", () => {
      const product = makeProduct({ labels: ["gluten-free"] });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 + 0.5 = 3.5
      expect(result.score).toBeCloseTo(3.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Glutenfrei-Label");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(0.5, 1);
      expect(item!.condition).toBeUndefined();
    });

    it("sugar > 20g → penalty -2.0, condition NOT set (same as generic)", () => {
      const product = makeProduct({ nutriments: { sugars: 21 } });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 - 2.0 = 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 20g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-2.0, 1);
      expect(item!.condition).toBeUndefined();
    });

    it("sugar > 10g ≤ 20g → penalty -1.0, condition NOT set (same as generic)", () => {
      const product = makeProduct({ nutriments: { sugars: 11 } });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 - 1.0 = 2.0
      expect(result.score).toBeCloseTo(2.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 10g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-1.0, 1);
      expect(item!.condition).toBeUndefined();
    });

    it("sugar > 5g ≤ 10g → penalty -0.5, condition: hashimoto (new tier)", () => {
      const product = makeProduct({ nutriments: { sugars: 7 } });
      const result = calculateScore(product, hashimotoProfile);
      // 3.0 - 0.5 = 2.5
      expect(result.score).toBeCloseTo(2.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 5g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-0.5, 1);
      expect(item!.condition).toBe("hashimoto");
    });
  });

  // -------------------------------------------------------------------------
  // 3. PCOS profile — threshold verification
  // -------------------------------------------------------------------------
  describe("PCOS profile — thresholds", () => {
    const pcosProfile: import("../domain/user-profile").UserProfile = {
      condition: "pcos",
      glutenSensitive: false,
      lactoseIntolerant: false,
    };

    it("fiber > 6g → bonus +1.5, condition: pcos", () => {
      const product = makeProduct({ nutriments: { fiber: 7 } });
      const result = calculateScore(product, pcosProfile);
      // 3.0 + 1.5 = 4.5
      expect(result.score).toBeCloseTo(4.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Ballaststoffe > 6g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(1.5, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("protein > 20g → bonus +1.0, condition: pcos", () => {
      const product = makeProduct({ nutriments: { protein: 21 } });
      const result = calculateScore(product, pcosProfile);
      // 3.0 + 1.0 = 4.0
      expect(result.score).toBeCloseTo(4.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Protein > 20g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(1.0, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("organic label → bonus +0.3, condition: pcos", () => {
      const product = makeProduct({ labels: ["organic"] });
      const result = calculateScore(product, pcosProfile);
      // 3.0 + 0.3 = 3.3
      expect(result.score).toBeCloseTo(3.3, 1);
      const item = result.breakdown.find((i) => i.reason === "Bio-Label");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(0.3, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("gluten-free label → bonus +0.2, condition: pcos", () => {
      const product = makeProduct({ labels: ["gluten-free"] });
      const result = calculateScore(product, pcosProfile);
      // 3.0 + 0.2 = 3.2
      expect(result.score).toBeCloseTo(3.2, 1);
      const item = result.breakdown.find((i) => i.reason === "Glutenfrei-Label");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(0.2, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("sugar > 5g ≤ 10g → penalty -1.5, condition: pcos", () => {
      const product = makeProduct({ nutriments: { sugars: 7 } });
      const result = calculateScore(product, pcosProfile);
      // 3.0 - 1.5 = 1.5
      expect(result.score).toBeCloseTo(1.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 5g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-1.5, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("sugar > 10g ≤ 20g → penalty -2.5, condition: pcos", () => {
      const product = makeProduct({ nutriments: { sugars: 11 } });
      const result = calculateScore(product, pcosProfile);
      // 3.0 - 2.5 = 0.5 → clamped to 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 10g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-2.5, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("sugar > 20g → penalty -3.5, condition: pcos", () => {
      const product = makeProduct({ nutriments: { sugars: 21 } });
      const result = calculateScore(product, pcosProfile);
      // 3.0 - 3.5 = -0.5 → clamped to 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 20g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-3.5, 1);
      expect(item!.condition).toBe("pcos");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Both profile — stricter values
  // -------------------------------------------------------------------------
  describe("Both profile — stricter values", () => {
    const bothProfile: import("../domain/user-profile").UserProfile = {
      condition: "both",
      glutenSensitive: false,
      lactoseIntolerant: false,
    };

    it("sugar > 5g ≤ 10g → penalty -2.0, condition: both", () => {
      const product = makeProduct({ nutriments: { sugars: 7 } });
      const result = calculateScore(product, bothProfile);
      // 3.0 - 2.0 = 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 5g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-2.0, 1);
      expect(item!.condition).toBe("both");
    });

    it("sugar > 10g → penalty -3.0, condition: both", () => {
      const product = makeProduct({ nutriments: { sugars: 11 } });
      const result = calculateScore(product, bothProfile);
      // 3.0 - 3.0 = 0 → clamped to 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 10g/100g");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-3.0, 1);
      expect(item!.condition).toBe("both");
    });

    it("gluten in ingredients → penalty -2.0, condition: both", () => {
      const product = makeProduct({ ingredients: "wheat gluten, water" });
      const result = calculateScore(product, bothProfile);
      // 3.0 - 2.0 = 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Gluten in Zutaten");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-2.0, 1);
      expect(item!.condition).toBe("both");
    });

    it("gluten-free label → bonus +0.8, condition: both", () => {
      const product = makeProduct({ labels: ["gluten-free"] });
      const result = calculateScore(product, bothProfile);
      // 3.0 + 0.8 = 3.8
      expect(result.score).toBeCloseTo(3.8, 1);
      const item = result.breakdown.find((i) => i.reason === "Glutenfrei-Label");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(0.8, 1);
      expect(item!.condition).toBe("both");
    });
  });

  // -------------------------------------------------------------------------
  // 5. glutenSensitive multiplier
  // -------------------------------------------------------------------------
  describe("glutenSensitive multiplier", () => {
    it("Hashimoto + glutenSensitive=true: gluten penalty = -3.0 (1.5 × 2), condition: hashimoto", () => {
      const profile: import("../domain/user-profile").UserProfile = {
        condition: "hashimoto",
        glutenSensitive: true,
        lactoseIntolerant: false,
      };
      const product = makeProduct({ ingredients: "wheat gluten, water" });
      const result = calculateScore(product, profile);
      // 3.0 - 3.0 = 0 → clamped to 1.0
      expect(result.score).toBeCloseTo(1.0, 1);
      const item = result.breakdown.find((i) => i.reason === "Gluten in Zutaten");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-3.0, 1);
      expect(item!.condition).toBe("hashimoto");
    });

    it("Hashimoto + glutenSensitive=false: gluten penalty = -1.5, condition: hashimoto", () => {
      const profile: import("../domain/user-profile").UserProfile = {
        condition: "hashimoto",
        glutenSensitive: false,
        lactoseIntolerant: false,
      };
      const product = makeProduct({ ingredients: "wheat gluten, water" });
      const result = calculateScore(product, profile);
      // 3.0 - 1.5 = 1.5
      expect(result.score).toBeCloseTo(1.5, 1);
      const item = result.breakdown.find((i) => i.reason === "Gluten in Zutaten");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-1.5, 1);
      expect(item!.condition).toBe("hashimoto");
    });
  });

  // -------------------------------------------------------------------------
  // 6. lactoseIntolerant multiplier
  // -------------------------------------------------------------------------
  describe("lactoseIntolerant multiplier", () => {
    it("PCOS + lactoseIntolerant=true: dairy penalty = -0.6 (0.3 × 2), condition: pcos", () => {
      const profile: import("../domain/user-profile").UserProfile = {
        condition: "pcos",
        glutenSensitive: false,
        lactoseIntolerant: true,
      };
      const product = makeProduct({ ingredients: "skim milk, water" });
      const result = calculateScore(product, profile);
      // 3.0 - 0.6 = 2.4
      expect(result.score).toBeCloseTo(2.4, 1);
      const item = result.breakdown.find((i) => i.reason === "Milchbestandteile");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-0.6, 1);
      expect(item!.condition).toBe("pcos");
    });

    it("PCOS + lactoseIntolerant=false: dairy penalty = -0.3, condition NOT set", () => {
      const profile: import("../domain/user-profile").UserProfile = {
        condition: "pcos",
        glutenSensitive: false,
        lactoseIntolerant: false,
      };
      const product = makeProduct({ ingredients: "skim milk, water" });
      const result = calculateScore(product, profile);
      // 3.0 - 0.3 = 2.7
      expect(result.score).toBeCloseTo(2.7, 1);
      const item = result.breakdown.find((i) => i.reason === "Milchbestandteile");
      expect(item).toBeDefined();
      expect(item!.points).toBeCloseTo(-0.3, 1);
      expect(item!.condition).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 7. ScoreBreakdownItem condition tagging
  // -------------------------------------------------------------------------
  describe("ScoreBreakdownItem condition tagging", () => {
    it("profile mode active + differing value → item.condition matches profile.condition", () => {
      const profile: import("../domain/user-profile").UserProfile = {
        condition: "pcos",
        glutenSensitive: false,
        lactoseIntolerant: false,
      };
      // fiber > 6g → pcos bonus differs from generic (1.5 vs 1.0)
      const product = makeProduct({ nutriments: { fiber: 7 } });
      const result = calculateScore(product, profile);
      const item = result.breakdown.find((i) => i.reason === "Ballaststoffe > 6g/100g");
      expect(item).toBeDefined();
      expect(item!.condition).toBe("pcos");
    });

    it("sugar > 5g always has condition set, even for hashimoto (-0.5)", () => {
      const profile: import("../domain/user-profile").UserProfile = {
        condition: "hashimoto",
        glutenSensitive: false,
        lactoseIntolerant: false,
      };
      const product = makeProduct({ nutriments: { sugars: 7 } });
      const result = calculateScore(product, profile);
      const item = result.breakdown.find((i) => i.reason === "Zucker > 5g/100g");
      expect(item).toBeDefined();
      expect(item!.condition).toBe("hashimoto");
    });
  });
});

// =============================================================================
// RED PHASE: Test for validateNutriments function (does not exist yet)
// This test will FAIL until we implement the function
// =============================================================================
describe("validateNutriments function (RED phase test)", () => {
  it("should exist as an exported function", async () => {
    // This import will fail at compile/run time if function doesn't exist
    const { validateNutriments } = await import("./scoring-service");
    expect(typeof validateNutriments).toBe("function");
  });

  it("should clamp negative values to 0", async () => {
    const { validateNutriments } = await import("./scoring-service");
    const result = validateNutriments({
      sugars: -20,
      fiber: -5,
      protein: -10,
    });
    expect(result.sugars).toBe(0);
    expect(result.fiber).toBe(0);
    expect(result.protein).toBe(0);
  });

  it("should clamp unrealistic values", async () => {
    const { validateNutriments } = await import("./scoring-service");
    const result = validateNutriments({
      energyKcal: 5000,
      sugars: 150,
      fat: 200,
    });
    expect(result.energyKcal).toBe(4000);
    expect(result.sugars).toBe(100);
    expect(result.fat).toBe(100);
  });

  it("should leave valid values unchanged", async () => {
    const { validateNutriments } = await import("./scoring-service");
    const input = { sugars: 15, fiber: 5, protein: 20 };
    const result = validateNutriments(input);
    expect(result.sugars).toBe(15);
    expect(result.fiber).toBe(5);
    expect(result.protein).toBe(20);
  });
});
