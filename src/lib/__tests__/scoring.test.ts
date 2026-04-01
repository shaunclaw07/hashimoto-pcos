import { describe, it, expect } from 'vitest';
import { calculateScore, type ScoreResult } from '../scoring';
import type { OpenFoodFactsProduct } from '../openfoodfacts';
import sehrGut from '../../../tests/fixtures/products/sehr-gut.json';
import gut from '../../../tests/fixtures/products/gut.json';
import neutral from '../../../tests/fixtures/products/neutral.json';
import wenigerGut from '../../../tests/fixtures/products/weniger-gut.json';
import vermeiden from '../../../tests/fixtures/products/vermeiden.json';

describe('calculateScore', () => {
  describe('Olivenöl', () => {
    it('sollte Score von 2.5 haben mit Bio-Label (wegen gesättigten Fetten)', () => {
      const oliveOil: OpenFoodFactsProduct = {
        product_name: 'Olivenöl',
        nutriments: {
          sugars_100g: 0,
          fat_100g: 100,
          'saturated-fat_100g': 14, // >10g → -1.0 malus
          fiber_100g: 0,
          proteins_100g: 0,
          salt_100g: 0,
        },
        labels: 'organic', // +0.5
      };

      const result = calculateScore(oliveOil);

      // 3.0 + 0.5 (bio) - 1.0 (saturated fat) = 2.5
      expect(result.score).toBe(2.5);
      expect(result.label).toBe('NEUTRAL');
    });

    it('sollte ohne Labels einen Score von 2.0 haben', () => {
      const oliveOil: OpenFoodFactsProduct = {
        product_name: 'Olivenöl',
        nutriments: {
          sugars_100g: 0,
          fat_100g: 100,
          'saturated-fat_100g': 14, // >10g → -1.0 malus
          fiber_100g: 0,
          proteins_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(oliveOil);

      // 3.0 - 1.0 = 2.0
      expect(result.score).toBe(2.0);
      expect(result.label).toBe('WENIGER GUT');
    });
  });

  describe('Nutella', () => {
    it('sollte Score 1.0 haben wegen hohem Zucker und Milch', () => {
      const nutella: OpenFoodFactsProduct = {
        product_name: 'Nutella',
        nutriments: {
          sugars_100g: 56, // >20g → -2.0
          fat_100g: 31,
          'saturated-fat_100g': 10, // exactly 10, not >10
          fiber_100g: 0,
          proteins_100g: 6,
          salt_100g: 0.1,
        },
        ingredients_text: 'Sugar, palm oil, hazelnuts, cocoa, milk, soy, vanilla', // milk → -0.3
      };

      const result = calculateScore(nutella);

      // 3.0 - 2.0 - 0.3 = 0.7 → clamped to 1.0
      expect(result.score).toBe(1.0);
      expect(result.label).toBe('VERMEIDEN');
      expect(result.maluses).toBeGreaterThan(0);
    });
  });

  describe('Haferflocken', () => {
    it('sollte Score 4.5+ haben wegen Ballaststoffen, Protein und Glutenfrei-Label', () => {
      const oats: OpenFoodFactsProduct = {
        product_name: 'Haferflocken',
        nutriments: {
          sugars_100g: 1,
          fat_100g: 7,
          'saturated-fat_100g': 1.2,
          fiber_100g: 10, // >6g → +1.0
          proteins_100g: 13, // nicht >20g, kein Protein bonus
          salt_100g: 0.01,
        },
        labels: 'gluten-free', // +0.5
      };

      const result = calculateScore(oats);

      // 3.0 + 1.0 (fiber >6g) + 0.5 (gluten-free) = 4.5
      expect(result.score).toBe(4.5);
      expect(result.label).toBe('SEHR GUT');
      expect(result.bonuses).toBeGreaterThan(0);
    });
  });

  describe('Chips', () => {
    it('sollte Score 3.0 haben (keine Boni, keine Mali bei diesen Werten)', () => {
      const chips: OpenFoodFactsProduct = {
        product_name: 'Chips',
        nutriments: {
          sugars_100g: 3, // <10, no malus
          fat_100g: 35,
          'saturated-fat_100g': 5, // <10, no malus
          fiber_100g: 3, // exactly 3, not >3, no bonus
          proteins_100g: 7,
          salt_100g: 1.5, // exactly 1.5, not >1.5, no malus
        },
      };

      const result = calculateScore(chips);

      // 3.0 base, no bonuses or maluses
      expect(result.score).toBe(3.0);
      expect(result.label).toBe('NEUTRAL');
    });

    it('sollte Score 2.5 haben bei hohem Salzgehalt', () => {
      const chips: OpenFoodFactsProduct = {
        product_name: 'Chips',
        nutriments: {
          sugars_100g: 3,
          fat_100g: 35,
          'saturated-fat_100g': 5,
          fiber_100g: 3,
          proteins_100g: 7,
          salt_100g: 3.0, // >2.5 → -1.0
        },
      };

      const result = calculateScore(chips);

      // 3.0 - 1.0 = 2.0
      expect(result.score).toBe(2.0);
      expect(result.label).toBe('WENIGER GUT');
    });
  });

  describe('Bonus-Punkte', () => {
    it('Ballaststoffe > 6g → +1.0', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 8,
          sugars_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      const fiberBonus = result.breakdown.find(b => b.reason.includes('Ballaststoffe > 6g'));
      expect(fiberBonus?.points).toBe(1.0);
    });

    it('Ballaststoffe > 3g → +0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 4,
          sugars_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      const fiberBonus = result.breakdown.find(b => b.reason.includes('Ballaststoffe > 3g'));
      expect(fiberBonus?.points).toBe(0.5);
    });

    it('Protein > 20g → +0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          proteins_100g: 25,
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      const proteinBonus = result.breakdown.find(b => b.reason.includes('Protein > 20g'));
      expect(proteinBonus?.points).toBe(0.5);
    });

    it('Omega-3 in labels → +1.0', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'omega-3 fatty acids',
      };

      const result = calculateScore(product);

      const omega3Bonus = result.breakdown.find(b => b.reason.includes('Omega-3'));
      expect(omega3Bonus?.points).toBe(1.0);
    });

    it('Glutenfrei-Label → +0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'gluten-free',
      };

      const result = calculateScore(product);

      const labelBonus = result.breakdown.find(b => b.reason.includes('Glutenfrei-Label'));
      expect(labelBonus?.points).toBe(0.5);
    });

    it('Bio-Label (organic) → +0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'organic',
      };

      const result = calculateScore(product);

      const labelBonus = result.breakdown.find(b => b.reason.includes('Bio-Label'));
      expect(labelBonus?.points).toBe(0.5);
    });
  });

  describe('Malus-Punkte', () => {
    it('Zucker > 20g → -2.0', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          sugars_100g: 25,
          fiber_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      const sugarMalus = result.breakdown.find(b => b.reason.includes('Zucker > 20g'));
      expect(sugarMalus?.points).toBe(-2.0);
    });

    it('Zucker > 10g → -1.0', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          sugars_100g: 15,
          fiber_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      const sugarMalus = result.breakdown.find(b => b.reason.includes('Zucker > 10g'));
      expect(sugarMalus?.points).toBe(-1.0);
    });

    it('Gesättigte Fette > 10g → -1.0', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          'saturated-fat_100g': 12,
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      const fatMalus = result.breakdown.find(b => b.reason.includes('Gesättigte Fette'));
      expect(fatMalus?.points).toBe(-1.0);
    });

    it('Salz > 2.5g → -1.0', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          salt_100g: 3,
          fiber_100g: 0,
          sugars_100g: 0,
        },
      };

      const result = calculateScore(product);

      const saltMalus = result.breakdown.find(b => b.reason.includes('Salz > 2.5g'));
      expect(saltMalus?.points).toBe(-1.0);
    });

    it('Salz > 1.5g → -0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          salt_100g: 2,
          fiber_100g: 0,
          sugars_100g: 0,
        },
      };

      const result = calculateScore(product);

      const saltMalus = result.breakdown.find(b => b.reason.includes('Salz > 1.5g'));
      expect(saltMalus?.points).toBe(-0.5);
    });

    it('Gluten in Zutaten → -0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        ingredients_text: 'Contains gluten',
      };

      const result = calculateScore(product);

      const glutenMalus = result.breakdown.find(b => b.reason.includes('Gluten in Zutaten'));
      expect(glutenMalus?.points).toBe(-0.5);
    });

    it('Laktose in Zutaten → -0.3', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        ingredients_text: 'Contains lactose',
      };

      const result = calculateScore(product);

      const lactoseMalus = result.breakdown.find(b => b.reason.includes('Laktose in Zutaten'));
      expect(lactoseMalus?.points).toBe(-0.3);
    });

    it('>5 Zusatzstoffe → -0.5', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        additives: ['E100', 'E200', 'E300', 'E400', 'E500', 'E600'],
      };

      const result = calculateScore(product);

      const additivesMalus = result.breakdown.find(b => b.reason.includes('>5 Zusatzstoffe'));
      expect(additivesMalus?.points).toBe(-0.5);
    });
  });

  describe('Score Clamping', () => {
    it('sollte nicht unter 1 fallen', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          sugars_100g: 100, // Max malus
          'saturated-fat_100g': 100,
          salt_100g: 100,
          fiber_100g: 0,
        },
        ingredients_text: 'gluten lactose milk',
        additives: ['1', '2', '3', '4', '5', '6', '7'],
      };

      const result = calculateScore(product);

      expect(result.score).toBeGreaterThanOrEqual(1);
    });

    it('sollte nicht über 5 steigen', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 20, // Max bonus
          proteins_100g: 30,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'organic gluten-free',
        categories: 'omega-3',
      };

      const result = calculateScore(product);

      expect(result.score).toBeLessThanOrEqual(5);
    });
  });

  describe('Stars Berechnung', () => {
    it('score >= 4.5 → 5 stars', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 10,
          proteins_100g: 25,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'organic gluten-free',
        categories: 'omega-3',
      };

      const result = calculateScore(product);

      expect(result.stars).toBe(5);
    });

    it('score >= 3.5 → 4 stars', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 7, // >6g → +1.0
          proteins_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        // no labels
      };

      const result = calculateScore(product);

      // 3.0 + 1.0 = 4.0 → 4 stars
      expect(result.stars).toBe(4);
    });

    it('score >= 2.5 → 3 stars', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          proteins_100g: 0,
          sugars_100g: 5,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      expect(result.stars).toBe(3);
    });

    it('score >= 1.5 → 2 stars', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          proteins_100g: 0,
          sugars_100g: 15,
          salt_100g: 1.8,
        },
      };

      const result = calculateScore(product);

      expect(result.stars).toBe(2);
    });

    it('score < 1.5 → 1 star', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          proteins_100g: 0,
          sugars_100g: 50,
          salt_100g: 3,
          'saturated-fat_100g': 15,
        },
        ingredients_text: 'gluten lactose',
        additives: ['1', '2', '3', '4', '5', '6'],
      };

      const result = calculateScore(product);

      expect(result.stars).toBe(1);
    });
  });

  describe('Label Zuordnung', () => {
    it('>= 4.5 → SEHR GUT', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 10,
          proteins_100g: 25,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'organic gluten-free',
        categories: 'omega-3',
      };

      const result = calculateScore(product);

      expect(result.label).toBe('SEHR GUT');
    });

    it('>= 3.5 → GUT', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 5,
          sugars_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      expect(result.label).toBe('GUT');
    });

    it('>= 2.5 → NEUTRAL', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
      };

      const result = calculateScore(product);

      expect(result.label).toBe('NEUTRAL');
    });

    it('>= 1.5 → WENIGER GUT', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 15,
          salt_100g: 2,
        },
      };

      const result = calculateScore(product);

      expect(result.label).toBe('WENIGER GUT');
    });

    it('< 1.5 → VERMEIDEN', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 50,
          salt_100g: 3,
          'saturated-fat_100g': 15,
        },
        ingredients_text: 'gluten lactose',
        additives: ['1', '2', '3', '4', '5', '6'],
      };

      const result = calculateScore(product);

      expect(result.label).toBe('VERMEIDEN');
    });
  });

  describe('Fixture-Produkte (aus products.db)', () => {
    it('Green Lentils → SEHR GUT', () => {
      const result = calculateScore(sehrGut as OpenFoodFactsProduct);
      expect(result.label).toBe('SEHR GUT');
      expect(result.score).toBeGreaterThanOrEqual(4.5);
    });

    it('100% Whole Wheat Bagels → GUT', () => {
      const result = calculateScore(gut as OpenFoodFactsProduct);
      expect(result.label).toBe('GUT');
      expect(result.score).toBeGreaterThanOrEqual(3.5);
    });

    it('Designer Whey Protein Vanilla → NEUTRAL', () => {
      const result = calculateScore(neutral as OpenFoodFactsProduct);
      expect(result.label).toBe('NEUTRAL');
      expect(result.score).toBeGreaterThanOrEqual(2.5);
    });

    it('Schafsalami → WENIGER GUT', () => {
      const result = calculateScore(wenigerGut as OpenFoodFactsProduct);
      expect(result.label).toBe('WENIGER GUT');
      expect(result.score).toBeGreaterThanOrEqual(1.5);
      expect(result.score).toBeLessThan(2.5);
    });

    it('Hazelnut Spread with Cocoa → VERMEIDEN', () => {
      const result = calculateScore(vermeiden as OpenFoodFactsProduct);
      expect(result.label).toBe('VERMEIDEN');
      expect(result.score).toBeLessThan(1.5);
    });
  });

  describe('Edge Cases', () => {
    it('sollte mit fehlenden nutriments umgehen können', () => {
      const product: OpenFoodFactsProduct = {};

      const result = calculateScore(product);

      expect(result.score).toBe(3.0); // Base score
      expect(result.label).toBe('NEUTRAL');
    });

    it('sollte case-insensitive für Labels prüfen', () => {
      const product: OpenFoodFactsProduct = {
        nutriments: {
          fiber_100g: 0,
          sugars_100g: 0,
          salt_100g: 0,
        },
        labels: 'Organic Gluten-Free BIO',
      };

      const result = calculateScore(product);

      const glutenFree = result.breakdown.find(b => b.reason.includes('Glutenfrei-Label'));
      const bio = result.breakdown.find(b => b.reason.includes('Bio-Label'));

      expect(glutenFree?.points).toBe(0.5);
      expect(bio?.points).toBe(0.5);
    });
  });
});
