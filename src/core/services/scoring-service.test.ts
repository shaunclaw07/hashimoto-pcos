// src/core/services/scoring-service.test.ts
import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring-service";
import type { Product } from "../domain/product";

// Hilfsfunktion: erstellt ein minimales Test-Produkt (alle Pflichtfelder vorhanden)
function makeProduct(overrides: Partial<Product> & { nutriments?: Partial<Product["nutriments"]> }): Product {
  return {
    barcode: "",
    name: "Test",
    nutriments: {},
    labels: [],
    ingredients: "",
    categories: [],
    additives: [],
    ...overrides,
    nutriments: { ...overrides.nutriments },
  };
}

describe("calculateScore", () => {
  describe("Olivenöl", () => {
    it("Score 2.5 mit Bio-Label (wegen gesättigten Fetten)", () => {
      const product = makeProduct({
        nutriments: { sugars: 0, fat: 100, saturatedFat: 14, fiber: 0, protein: 0, salt: 0 },
        labels: ["organic"],
      });
      const result = calculateScore(product);
      // 3.0 + 0.5 (bio) - 1.0 (sat fat > 10) = 2.5
      expect(result.score).toBe(2.5);
      expect(result.label).toBe("NEUTRAL");
    });

    it("Score 2.0 ohne Labels", () => {
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
    it("Score 1.0 wegen hohem Zucker, Milch und gesättigten Fetten", () => {
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

  describe("Ballaststoffe Bonus", () => {
    it("+1.0 für Ballaststoffe > 6g", () => {
      const product = makeProduct({ nutriments: { fiber: 7 } });
      const result = calculateScore(product);
      expect(result.score).toBe(4.0); // 3.0 + 1.0
      expect(result.bonuses).toBe(1.0);
    });

    it("+0.5 für Ballaststoffe > 3g", () => {
      const product = makeProduct({ nutriments: { fiber: 4 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5); // 3.0 + 0.5
    });

    it("kein Bonus für Ballaststoffe <= 3g", () => {
      const product = makeProduct({ nutriments: { fiber: 3 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.0);
    });
  });

  describe("Protein Bonus", () => {
    it("+0.5 für Protein > 20g", () => {
      const product = makeProduct({ nutriments: { protein: 21 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
      expect(result.bonuses).toBe(0.5);
    });
  });

  describe("Omega-3 Bonus", () => {
    it("+1.0 für omega-3 in categories", () => {
      const product = makeProduct({ categories: ["omega-3 fatty acids"] });
      const result = calculateScore(product);
      expect(result.score).toBe(4.0);
    });

    it("+1.0 für omega-3 in labels", () => {
      const product = makeProduct({ labels: ["omega-3"] });
      const result = calculateScore(product);
      expect(result.score).toBe(4.0);
    });
  });

  describe("Label Boni", () => {
    it("+0.5 für gluten-free Label", () => {
      const product = makeProduct({ labels: ["gluten-free"] });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
    });

    it("+0.5 für organic Label", () => {
      const product = makeProduct({ labels: ["organic"] });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
    });

    it("+0.5 für bio Label (case-insensitive)", () => {
      const product = makeProduct({ labels: ["Bio"] });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
    });
  });

  describe("Zucker Malus", () => {
    it("-2.0 für Zucker > 20g", () => {
      const product = makeProduct({ nutriments: { sugars: 21 } });
      const result = calculateScore(product);
      expect(result.score).toBe(1.0);
      expect(result.maluses).toBe(2.0);
    });

    it("-1.0 für Zucker > 10g", () => {
      const product = makeProduct({ nutriments: { sugars: 11 } });
      const result = calculateScore(product);
      expect(result.score).toBe(2.0);
      expect(result.maluses).toBe(1.0);
    });
  });

  describe("Salz Malus", () => {
    it("-1.0 für Salz > 2.5g", () => {
      const product = makeProduct({ nutriments: { salt: 3 } });
      const result = calculateScore(product);
      expect(result.score).toBe(2.0);
    });

    it("-0.5 für Salz > 1.5g", () => {
      const product = makeProduct({ nutriments: { salt: 2 } });
      const result = calculateScore(product);
      expect(result.score).toBe(2.5);
    });
  });

  describe("Zutaten Malus", () => {
    it("-0.5 für Gluten in Zutaten", () => {
      const product = makeProduct({ ingredients: "wheat gluten, water" });
      const result = calculateScore(product);
      expect(result.score).toBe(2.5);
      expect(result.maluses).toBe(0.5);
    });

    it("-0.3 für milk in Zutaten", () => {
      const product = makeProduct({ ingredients: "skim milk, sugar" });
      const result = calculateScore(product);
      expect(result.score).toBeCloseTo(2.7, 1);
      expect(result.maluses).toBeCloseTo(0.3, 1);
    });
  });

  describe("Zusatzstoffe Malus", () => {
    it("-0.5 für mehr als 5 Zusatzstoffe", () => {
      const product = makeProduct({
        additives: ["en:e100", "en:e200", "en:e300", "en:e400", "en:e500", "en:e600"],
      });
      const result = calculateScore(product);
      expect(result.score).toBe(2.5);
    });

    it("kein Malus für genau 5 Zusatzstoffe", () => {
      const product = makeProduct({
        additives: ["en:e100", "en:e200", "en:e300", "en:e400", "en:e500"],
      });
      const result = calculateScore(product);
      expect(result.score).toBe(3.0);
    });
  });

  describe("Score Clamping", () => {
    it("Score wird auf 5.0 geclampt", () => {
      const product = makeProduct({
        nutriments: { fiber: 10, protein: 25 },
        labels: ["gluten-free", "organic", "omega-3"],
      });
      const result = calculateScore(product);
      expect(result.score).toBe(5.0);
      expect(result.stars).toBe(5);
    });

    it("Score wird auf 1.0 geclampt", () => {
      const product = makeProduct({
        nutriments: { sugars: 100, saturatedFat: 50, salt: 10 },
        ingredients: "skim milk",
      });
      const result = calculateScore(product);
      expect(result.score).toBe(1.0);
      expect(result.stars).toBe(1);
    });
  });

  describe("Score Labels und Sterne", () => {
    it("Score 4.5+ → SEHR GUT, 5 Sterne", () => {
      const product = makeProduct({ nutriments: { fiber: 10, protein: 25 }, labels: ["organic"] });
      const result = calculateScore(product);
      expect(result.label).toBe("SEHR GUT");
      expect(result.stars).toBe(5);
    });

    it("Score 3.5-4.4 → GUT, 4 Sterne", () => {
      const product = makeProduct({ nutriments: { fiber: 4 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.5);
      expect(result.label).toBe("GUT");
      expect(result.stars).toBe(4);
    });

    it("Score 2.5-3.4 → NEUTRAL, 3 Sterne", () => {
      const product = makeProduct({});
      const result = calculateScore(product);
      expect(result.score).toBe(3.0);
      expect(result.label).toBe("NEUTRAL");
      expect(result.stars).toBe(3);
    });
  });

  describe("Echte Produkt-Fixtures", () => {
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
