import { test, expect } from '@playwright/test';
import { mockProductApi } from '../tests/helpers/mock-api';

/**
 * E2E tests for the 4 new scoring features:
 * - Issue #50: Soy / Phytoestrogen detection
 * - Issue #51: Goitrogen warning for raw cruciferous vegetables
 * - Issue #53: Differentiated Omega-3 detection
 * - Issue #54: Tiered dairy detection
 */

const PROFILE_KEY = 'hashimoto-pcos-user-profile';
const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

// ============================================================================
// Helper: converts OFF format (proteins_100g) → domain format
// ============================================================================
function fromOff(n: Record<string, unknown>) {
  return {
    energyKcal: n['energy-kcal_100g'] as number | undefined,
    fat: n['fat_100g'] as number | undefined,
    saturatedFat: n['saturated-fat_100g'] as number | undefined,
    carbohydrates: n['carbohydrates_100g'] as number | undefined,
    sugars: n['sugars_100g'] as number | undefined,
    fiber: n['fiber_100g'] as number | undefined,
    protein: n['proteins_100g'] as number | undefined,
    salt: n['salt_100g'] as number | undefined,
  };
}

// ============================================================================
// Issue #53 — Omega-3 differentiated
// ============================================================================
test.describe('Issue #53 — Omega-3 differentiated', () => {
  test('salmon shows Omega-3 (EPA/DHA, marine source) in breakdown', async ({ page }) => {
    const lachs = {
      barcode: '0040668004156',
      name: 'Wild Salmon Jerky',
      nutriments: fromOff({ 'energy-kcal_100g': 286, 'sugars_100g': 7, 'fat_100g': 9, 'saturated-fat_100g': 1.8, 'fiber_100g': 0, 'proteins_100g': 46, 'salt_100g': 7 }),
      labels: [] as string[],
      ingredients: 'ALASKA WILDLACHS FILET, SALZ, ZUCKER, GEWUERTZE, PFEFFER',
      categories: [] as string[],
      additives: [] as string[],
    };
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await mockProductApi(page, lachs.barcode, lachs);
    await page.goto(`/result/${lachs.barcode}`);
    await expect(page.getByText(/Omega-3.*EPA.*DHA.*mariner/i)).toBeVisible({ timeout: 8000 });
  });

  test('walnut oil shows Omega-3 (ALA, plant-based) in breakdown', async ({ page }) => {
    const walnuss = {
      barcode: '0032481395269',
      name: 'Walnussöl',
      nutriments: fromOff({ 'energy-kcal_100g': 898, 'sugars_100g': 0, 'fat_100g': 99, 'saturated-fat_100g': 11, 'fiber_100g': 0, 'proteins_100g': 0, 'salt_100g': 0 }),
      labels: [] as string[],
      ingredients: 'Walnussöl',
      categories: [] as string[],
      additives: [] as string[],
    };
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await mockProductApi(page, walnuss.barcode, walnuss);
    await page.goto(`/result/${walnuss.barcode}`);
    await expect(page.getByText(/Omega-3.*ALA.*pflanzlich/i)).toBeVisible({ timeout: 8000 });
  });
});

// ============================================================================
// Issue #50 — Soy / Phytoestrogen detection
// ============================================================================
test.describe('Issue #50 — Soy / Phytoestrogen detection', () => {
  test('tofu/soy product shows soy (phytoestrogens) in breakdown for Hashimoto profile', async ({ page }) => {
    // Product with soy protein
    const tofu = {
      barcode: '0010044540400',
      name: 'Vegane Mühlen Frikadellen aus Sojaprotein',
      nutriments: fromOff({ 'energy-kcal_100g': 169, 'sugars_100g': 1, 'fat_100g': 9, 'saturated-fat_100g': 0.7, 'fiber_100g': 7, 'proteins_100g': 8.5, 'salt_100g': 2 }),
      labels: ['vegan'] as string[],
      ingredients: 'Trinkwasser, Sojaprotein, Rapsöl, Zwiebeln',
      categories: ['de:fleischersatzprodukte'] as string[],
      additives: ['en:e461'] as string[],
    };

    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);

    await mockProductApi(page, tofu.barcode, tofu);
    await page.goto(`/result/${tofu.barcode}`);
    await expect(page.getByText(/Soja.*Phytoöstrogene/i)).toBeVisible({ timeout: 8000 });
  });

  test('fermented soy (miso) shows fermented soy in breakdown for Hashimoto', async ({ page }) => {
    const miso = {
      barcode: '0619286802002',
      name: 'Migthy Miso Soup',
      nutriments: fromOff({ 'energy-kcal_100g': 12, 'sugars_100g': 0.3, 'fat_100g': 0.2, 'saturated-fat_100g': 0, 'fiber_100g': 0.3, 'proteins_100g': 0.5, 'salt_100g': 0.8 }),
      labels: ['organic'] as string[],
      ingredients: '*Miso 60% (*graines de soja, *riz brun, culture aspergillus oryzae), *tamari (*soja, sel marin)',
      categories: ['en:soups', 'en:miso-soup'] as string[],
      additives: [] as string[],
    };

    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);

    await mockProductApi(page, miso.barcode, miso);
    await page.goto(`/result/${miso.barcode}`);
    await expect(page.getByText(/Fermentiertes Soja/i)).toBeVisible({ timeout: 8000 });
  });
});

// ============================================================================
// Issue #54 — Extended dairy detection
// ============================================================================
test.describe('Issue #54 — Dairy tiered detection', () => {
  test('whey protein shows whey protein (Whey) in breakdown', async ({ page }) => {
    const whey = {
      barcode: '0000470322800',
      name: 'Whey Protein aus Molke Vanilla',
      nutriments: fromOff({ 'energy-kcal_100g': 389, 'sugars_100g': 6, 'fat_100g': 4.6, 'saturated-fat_100g': 2.5, 'fiber_100g': 0.1, 'proteins_100g': 78, 'salt_100g': 1.2 }),
      labels: [] as string[],
      ingredients: 'Molkenproteinkonzentrat 99%(_Wheyproteinkonzentrat_), Aroma, Pflanzenöl aus Raps, Süßungsmittel Acesulfam-K und Sucralose.',
      categories: ['en:dietary-supplements', 'en:protein-powders'] as string[],
      additives: ['en:e950', 'en:e955'] as string[],
    };
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await mockProductApi(page, whey.barcode, whey);
    await page.goto(`/result/${whey.barcode}`);
    await expect(page.getByText(/Molkenprotein.*Whey/i)).toBeVisible({ timeout: 8000 });
  });

  test('ghee shows NO dairy components in breakdown (neutral)', async ({ page }) => {
    const ghee = {
      barcode: '4068134119254',
      name: 'Ghee - clarified Butter',
      nutriments: fromOff({ 'energy-kcal_100g': 898, 'sugars_100g': 0, 'fat_100g': 99, 'saturated-fat_100g': 66, 'fiber_100g': 0, 'proteins_100g': 0, 'salt_100g': 0 }),
      labels: ['en:gluten-free'] as string[],
      ingredients: '100% organic Ghee (clarified Butter)',
      categories: ['en:fats', 'en:ghee'] as string[],
      additives: [] as string[],
    };
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await mockProductApi(page, ghee.barcode, ghee);
    await page.goto(`/result/${ghee.barcode}`);
    // Ghee should have no dairy components entry
    const milchText = page.getByText(/Milchbestandteile/i);
    await expect(milchText).not.toBeVisible({ timeout: 5000 });
  });

  test('casein product shows casein (A1) in breakdown for Hashimoto', async ({ page }) => {
    const caseinProd = {
      barcode: '0049405242721',
      name: 'no sugar added chocolate powder',
      nutriments: fromOff({ 'energy-kcal_100g': 350, 'sugars_100g': 0, 'fat_100g': 5, 'saturated-fat_100g': 2, 'fiber_100g': 0, 'proteins_100g': 30, 'salt_100g': 1 }),
      labels: [] as string[],
      ingredients: 'Nonfat dry milk, non-dairy creamer [maltodextrin, coconut oil, sodium caseinate (a milk)',
      categories: ['en:beverages'] as string[],
      additives: [] as string[],
    };

    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);

    await mockProductApi(page, caseinProd.barcode, caseinProd);
    await page.goto(`/result/${caseinProd.barcode}`);
    await expect(page.getByText(/Casein.*A1/i)).toBeVisible({ timeout: 8000 });
  });
});

// ============================================================================
// Issue #51 — Goitrogen warning
// ============================================================================
test.describe('Issue #51 — Goitrogen warning', () => {
  test('raw broccoli shows cruciferous (raw, goitrogens) for Hashimoto profile', async ({ page }) => {
    const rawBrokkoli = {
      barcode: '0000000000001',
      name: 'Frischer Brokkoli Salat',
      nutriments: fromOff({ 'energy-kcal_100g': 25, 'sugars_100g': 2, 'fat_100g': 0.3, 'saturated-fat_100g': 0.1, 'fiber_100g': 3, 'proteins_100g': 3, 'salt_100g': 0.05 }),
      labels: [] as string[],
      ingredients: 'Brokkoli, Salat, Dressing',
      categories: [] as string[],
      additives: [] as string[],
    };

    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);

    await mockProductApi(page, rawBrokkoli.barcode, rawBrokkoli);
    await page.goto(`/result/${rawBrokkoli.barcode}`);
    await expect(page.getByText(/Kreuzblütler.*roh.*Goitrogene/i)).toBeVisible({ timeout: 8000 });
  });
});
