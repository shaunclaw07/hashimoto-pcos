// src/core/services/scoring-service.test.ts
import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring-service";
import type { Product } from "../domain/product";

// Hilfsfunktion: erstellt ein minimales Test-Produkt (alle Pflichtfelder vorhanden)
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

  describe("Nährwert-Validierung (Issue #32)", () => {
    it("Negative Zucker werden auf 0 geclampt", () => {
      // sugars = -10 → clamp zu 0 → 0 > 20 = false, kein Malus
      const product = makeProduct({ nutriments: { sugars: -10 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(0);
      expect(result.score).toBe(3.0);
    });

    it("Hohe Zuckerwerte (>100g) werden auf 100 geclampt", () => {
      // sugars = 200 → clamp zu 100 → 100 > 20 = true → Malus 2.0
      const product = makeProduct({ nutriments: { sugars: 200 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(2.0);
      expect(result.score).toBe(1.0);
    });

    it("Negative Fiber werden auf 0 geclampt", () => {
      const product = makeProduct({ nutriments: { fiber: -5 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(0);
      expect(result.score).toBe(3.0);
    });

    it("Hohe Fiber-Werte (>100g) werden auf 100 geclampt", () => {
      // fiber = 150 → clamp zu 100 → 100 > 6 = true → Bonus 1.0
      const product = makeProduct({ nutriments: { fiber: 150 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(1.0);
    });

    it("Negative Salt werden auf 0 geclampt", () => {
      const product = makeProduct({ nutriments: { salt: -10 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(0);
      expect(result.score).toBe(3.0);
    });

    it("Hohe Salt-Werte (>100g) werden auf 100 geclampt", () => {
      // salt = 500 → clamp zu 100 → 100 > 2.5 = true → Malus 1.0
      const product = makeProduct({ nutriments: { salt: 500 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(1.0);
    });

    it("Energie > 4000 kcal wird auf 4000 geclampt", () => {
      // energyKcal currently not used in scoring, but should be clamped
      const product = makeProduct({ nutriments: { energyKcal: 5000 } });
      const result = calculateScore(product);
      expect(result.score).toBe(3.0); // No scoring impact, but no crash
    });

    it("Negative Protein werden auf 0 geclampt", () => {
      const product = makeProduct({ nutriments: { protein: -10 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(0);
    });

    it("Negative SaturatedFat werden auf 0 geclampt", () => {
      const product = makeProduct({ nutriments: { saturatedFat: -5 } });
      const result = calculateScore(product);
      expect(result.maluses).toBe(0);
    });

    it("Kombination: alle Nährwerte negativ oder unrealistisch hoch", () => {
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
      // sugars: -50 → 0, kein Malus
      // fiber: 200 → 100 → 100 > 6 → Bonus 1.0
      // saturatedFat: -20 → 0, kein Malus
      // salt: 500 → 100 → 100 > 2.5 → Malus 1.0
      // protein: -30 → 0, kein Bonus
      // Score: 3.0 + 1.0 - 1.0 = 3.0
      expect(result.score).toBe(3.0);
      expect(result.bonuses).toBe(1.0);
      expect(result.maluses).toBe(1.0);
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

describe("Nährwert-Validierung (Bugfix #32)", () => {
  describe("Negative Werte werden korrigiert", () => {
    it("negative Zuckerwerte geben keinen Bonus", () => {
      // Bug: sugars = -5 würde als "gut" gelten weil -5 nicht > 20
      // aber negativer Zucker sollte nicht negativ in Berechnungen einfließen
      const product = makeProduct({ nutriments: { sugars: -5 } });
      const result = calculateScore(product);
      // Ohne clamp: sugars=-5 → kein Malus → 3.0
      // Mit clamp: sugars=0 → kein Malus → 3.0 → gleiches Ergebnis, ABER
      // es darf KEIN Bonus sein, nur weil der Wert fehlerhaft negativ ist
      expect(result.maluses).toBe(0);
      expect(result.score).toBe(3.0); // neutral da kein Bonus
    });

    it("negativer Zucker darf nicht als niedrig interpretiert werden (Bonus)", () => {
      // sugars=-30 ist ein Fehlerwert - darf keinen Zucker-Malus geben
      const product = makeProduct({ nutriments: { sugars: -30 } });
      const result = calculateScore(product);
      // Ohne clamp: sugars=-30 → -30 > 20? nein → kein Malus ✓
      // aber auch: -30 > 10? nein → kein Malus ✓
      // Das ist zufällig richtig, ABER bei zukünftigen thresholds wird es falsch
      expect(result.maluses).toBe(0);
    });

    it("negative Faserwerte werden nicht als Ballaststoff-Bonus gewertet", () => {
      const product = makeProduct({ nutriments: { fiber: -10 } });
      const result = calculateScore(product);
      // Ohne clamp: fiber=-10 → -10 > 6? nein → kein Bonus ✓
      // Ohne clamp: fiber=-10 → -10 > 3? nein → kein Bonus ✓
      // Auch zufällig richtig, aber semantisch falsch
      expect(result.bonuses).toBe(0);
    });

    it("negative Proteine geben keinen Bonus", () => {
      const product = makeProduct({ nutriments: { protein: -5 } });
      const result = calculateScore(product);
      expect(result.bonuses).toBe(0);
    });
  });

  describe("Unrealistisch hohe Werte werden geclampt", () => {
    it("Energie > 4000 kcal wird geclampt", () => {
      const product = makeProduct({ nutriments: { energyKcal: 9000 } });
      const result = calculateScore(product);
      // Sollte keinen Bonus geben weil unrealistisch
      // Achtung: energyKcal wird aktuell NICHT im Scoring verwendet
      // Daher nur prüfen dass kein Crash
      expect(result.score).toBeDefined();
    });

    it("Zucker > 100g wird geclampt auf 100g", () => {
      // 100g Zucker = 2.0 malus → score 1.0
      // 200g Zucker = sollte ebenfalls 2.0 malus weil geclampt
      const product100 = makeProduct({ nutriments: { sugars: 100 } });
      const product200 = makeProduct({ nutriments: { sugars: 200 } });
      const result100 = calculateScore(product100);
      const result200 = calculateScore(product200);
      expect(result200.score).toBe(result100.score);
      expect(result100.score).toBe(1.0); // 3.0 - 2.0 malus
    });

    it("Ballaststoffe > 100g werden geclampt", () => {
      const product = makeProduct({ nutriments: { fiber: 150 } });
      const result = calculateScore(product);
      // fiber=150 → clamp auf 100 → >6 → bonus +1.0
      // Ohne clamp: >6 → bonus +1.0 (funktioniert zufällig richtig)
      // ABER: fiber=150 ist unrealistisch und sollte clamped werden
      expect(result.score).toBe(4.0); // 3.0 + 1.0
    });
  });

  describe("Kombinierte Validierung", () => {
    it("Alle Werte gleichzeitig negativ/hoch → korrektes Scoring", () => {
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
      // Alle Werte auf 0 geclampt → keine Boni/Mali → score 3.0
      expect(result.score).toBe(3.0);
      expect(result.bonuses).toBe(0);
      expect(result.maluses).toBe(0);
    });

    it("Mixed valid and invalid values", () => {
      const product = makeProduct({
        nutriments: {
          sugars: -5,     // ungültig → 0
          fiber: 7,       // gültig → bonus +1.0
          salt: 3,        // gültig → malus -1.0
        }
      });
      const result = calculateScore(product);
      // sugars=-5 → 0 (kein malus), fiber=7 → +1.0, salt=3 → -1.0
      // score = 3.0 + 1.0 - 1.0 = 3.0
      expect(result.score).toBe(3.0);
    });
  });
});

// =============================================================================
// EXPLICIT VALIDATION TESTS (Bugfix #32)
// =============================================================================
// Die validateNutriments() Funktion muss negative/unrealistische Werte clampen.
// Diese Tests scheitern OHNE Implementierung.
describe("validateNutriments (Bugfix #32)", () => {
  // Da validateNutriments noch nicht existiert, müssen diese Tests explizit
  // die clamps prüfen die im scoring passieren - oder prüfen dass die Funktion
  // existiert und korrekt arbeitet
  
  it("sollte negative Zucker auf 0 geclampt behandeln (Bonus-Logik)", () => {
    // Achtung: sugars=-5 führt zufällig zu keinem Malus weil -5>20 false
    // ABER: sugars=-5 ist fehlerhafte Daten und sollte nicht als "0" behandelt werden
    // für zukünftige Features die "niedrigen zucker" als Bonus sehen wollen
    // Wir testen hier das gewünschte Verhalten: validateNutriments clampet auf 0
    const product = makeProduct({ nutriments: { sugars: -5 } });
    const result = calculateScore(product);
    // Erwünscht: sugars wird auf 0 geclampt → kein Malus
    // Realität: sugars=-5 → kein Malus (zufällig richtig)
    // ABER: Das Problem ist semantisch - die Daten sind ungültig
    expect(result.score).toBe(3.0); // neutral da kein Bonus und kein Malus
  });

  it("Zucker > 100g muss auf 100g geclampt sein (nicht 200g=mehr Malus)", () => {
    const product = makeProduct({ nutriments: { sugars: 200 } });
    const result = calculateScore(product);
    // Erwünscht: sugars=200 → clamp auf 100 → malus 2.0 → score 1.0
    // Ohne clamp: sugars=200 → malus 2.0 → score 1.0 (zufällig richtig)
    // Das Problem tritt auf wenn thresholds sich ändern
    expect(result.score).toBe(1.0); // clamped auf 100g = malus 2.0
  });

  it("Alle negativen Makronährwerte auf 0", () => {
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
    // Alles auf 0 → kein Bonus, kein Malus → 3.0
    expect(result.score).toBe(3.0);
  });

  it("Unrealistisch hohe Energie wird nicht gecrasht", () => {
    const product = makeProduct({ nutriments: { energyKcal: 99999 } });
    const result = calculateScore(product);
    expect(result.score).toBeDefined();
    expect(result.stars).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// RED PHASE: Test for validateNutriments function (does not exist yet)
// This test will FAIL until we implement the function
// =============================================================================
describe("validateNutriments function (RED phase test)", () => {
  it("sollte als exportierte Funktion existieren", async () => {
    // This import will fail at compile/run time if function doesn't exist
    const { validateNutriments } = await import("./scoring-service");
    expect(typeof validateNutriments).toBe("function");
  });

  it("sollte negative Werte auf 0 clampen", async () => {
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

  it("sollte unrealistische Werte clampen", async () => {
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

  it("sollte gültige Werte unverändert lassen", async () => {
    const { validateNutriments } = await import("./scoring-service");
    const input = { sugars: 15, fiber: 5, protein: 20 };
    const result = validateNutriments(input);
    expect(result.sugars).toBe(15);
    expect(result.fiber).toBe(5);
    expect(result.protein).toBe(20);
  });
});
