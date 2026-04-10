import { test, expect } from '@playwright/test';
import { mockProductApi } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json';
import sehrGut from '../tests/fixtures/products/sehr-gut.json';
import wenigerGut from '../tests/fixtures/products/weniger-gut.json';
import brokkoliSalat from '../tests/fixtures/products/brokkoli-salat.json';
import honig from '../tests/fixtures/products/honig.json';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

test.describe('ScoreCard Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
  });

  test('scorecard_renders_without_crashing', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await expect(page.getByRole('button', { name: /speichern/i })).toBeVisible({ timeout: 5000 });
  });

  test('save_button_disabled_when_already_saved', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByText('Gespeichert')).toBeVisible({ timeout: 5000 });
  });

  test('vermeiden_label_shown_for_low_score_product', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await expect(page.getByText(/vermeiden/i)).toBeVisible({ timeout: 5000 });
  });

  test('sehr_gut_label_shown_for_high_score_product', async ({ page }) => {
    await mockProductApi(page, sehrGut.barcode, sehrGut);
    await page.goto(`/result/${sehrGut.barcode}`);
    await expect(page.getByText(/sehr gut/i)).toBeVisible({ timeout: 5000 });
  });

  test('condition_icon_has_accessible_aria_label', async ({ page }) => {
    // Schafsalami (weniger-gut.json) has no fiber field which triggers
    // PCOS-specific protein bonus in breakdown — condition icon appears.
    // Set PCOS profile so the condition icon shows.
    await mockProductApi(page, wenigerGut.barcode, wenigerGut);
    await page.addInitScript(() => {
      localStorage.setItem(
        'hashimoto-pcos-user-profile',
        JSON.stringify({ condition: 'pcos', glutenSensitive: false, lactoseIntolerant: false })
      );
    });
    await page.goto(`/result/${wenigerGut.barcode}`);
    await expect(
      page.locator('[role="img"][aria-label="PCOS"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('condition_icon_hashimoto_has_aria_label', async ({ page }) => {
    // brokkoli-salat contains Brokkoli (raw Brassica = goitrogen) → Hashimoto icon
    await mockProductApi(page, brokkoliSalat.barcode, brokkoliSalat);
    await page.addInitScript(() => {
      localStorage.setItem(
        'hashimoto-pcos-user-profile',
        JSON.stringify({ condition: 'hashimoto', glutenSensitive: false, lactoseIntolerant: false })
      );
    });
    await page.goto(`/result/${brokkoliSalat.barcode}`);
    await expect(
      page.locator('[role="img"][aria-label="Hashimoto-Thyreoiditis"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('condition_icon_both_profile_shows_both_aria_label', async ({ page }) => {
    // honig: 80g sugar (>20g) → sugar malus with condition="both"
    // For "both" profile, sugar > 20g triggers a breakdown item with condition="both"
    await mockProductApi(page, honig.barcode, honig);
    await page.addInitScript(() => {
      localStorage.setItem(
        'hashimoto-pcos-user-profile',
        JSON.stringify({ condition: 'both', glutenSensitive: false, lactoseIntolerant: false })
      );
    });
    await page.goto(`/result/${honig.barcode}`);
    // Sugar > 20g with "both" profile creates item with aria-label "Hashimoto-Thyreoiditis und PCOS"
    await expect(
      page.locator('[role="img"][aria-label="Hashimoto-Thyreoiditis und PCOS"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('missing_nutriment_shows_nicht_angegeben', async ({ page }) => {
    // weniger-gut.json (Schafsalami) has no "fiber" field →
    // "Ballaststoffe" NutrientRow value is undefined
    await mockProductApi(page, wenigerGut.barcode, wenigerGut);
    await page.goto(`/result/${wenigerGut.barcode}`);
    await expect(page.getByText('Nicht angegeben').first()).toBeVisible({ timeout: 5000 });
  });

  test('missing_nutriment_tooltip_opens_on_click', async ({ page }) => {
    await mockProductApi(page, wenigerGut.barcode, wenigerGut);
    await page.goto(`/result/${wenigerGut.barcode}`);
    await page.getByRole('button', { name: /warum fehlt dieser wert/i }).first().click();
    await expect(
      page.getByRole('tooltip', { name: /diese angabe fehlt in der produktdatenbank/i })
    ).toBeVisible({ timeout: 5000 });
  });
});
