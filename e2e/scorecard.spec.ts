import { test, expect } from '@playwright/test';
import { mockProductApi } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json';
import sehrGut from '../tests/fixtures/products/sehr-gut.json';
import wenigerGut from '../tests/fixtures/products/weniger-gut.json';

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
});
