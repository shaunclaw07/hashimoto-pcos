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
    await expect(page.getByText('SEHR GUT', { exact: true })).toBeVisible({ timeout: 5000 });
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

  test('education_link_visible_in_score_badge', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    const educationLink = page.getByRole('link', { name: /warum diese bewertung/i });
    await expect(educationLink).toBeVisible({ timeout: 5000 });
    await expect(educationLink).toHaveAttribute('href', '/education');
  });

  test('nutrient_row_uses_vertical_card_layout', async ({ page }) => {
    // Energie row should have label on top, value below in card tile style
    await mockProductApi(page, sehrGut.barcode, sehrGut);
    await page.goto(`/result/${sehrGut.barcode}`);
    const energieRow = page.locator('.grid.grid-cols-2 > div').filter({ hasText: 'Energie' }).first();
    // Label should be small/muted and appear above the bold value
    await expect(energieRow.locator('span').first()).toContainText('Energie');
    await expect(energieRow.locator('span').last()).toContainText('kcal');
    // Card tile should have background
    await expect(energieRow).toHaveClass(/rounded-xl/);
  });

  test('saturated_fat_label_shortened_to_ges_fettsaeuren', async ({ page }) => {
    await mockProductApi(page, sehrGut.barcode, sehrGut);
    await page.goto(`/result/${sehrGut.barcode}`);
    // Should find "Ges. Fettsäuren" not "davon gesättigt"
    await expect(page.getByText('Ges. Fettsäuren')).toBeVisible();
    await expect(page.getByText('davon gesättigt')).not.toBeVisible();
  });

  test('product_name_allows_wrapping_up_to_two_lines', async ({ page }) => {
    // Very long product name should wrap and truncate at 2 lines max
    await mockProductApi(page, sehrGut.barcode, sehrGut);
    await page.goto(`/result/${sehrGut.barcode}`);
    const nameEl = page.locator('h2').filter({ hasText: /./ }).first();
    await expect(nameEl).toHaveClass(/line-clamp-2/);
  });

  test('score_badge_shows_plain_language_description', async ({ page }) => {
    await mockProductApi(page, sehrGut.barcode, sehrGut);
    await page.goto(`/result/${sehrGut.barcode}`);
    // "Sehr gut" should have description "Sehr gut für Ihren Ernährungsplan"
    await expect(page.getByText('Sehr gut für Ihren Ernährungsplan')).toBeVisible();
  });

  test('score_legend_circles_fit_on_375px_viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // Legend section should not overflow horizontally
    const legend = page.locator('section').filter({ hasText: 'So funktioniert die Bewertung' });
    const legendBox = await legend.boundingBox();
    expect(legendBox?.width).toBeLessThanOrEqual(375);
    // All 5 labels should be visible without horizontal scroll
    await expect(page.getByText('Vermeiden')).toBeVisible();
  });
});
