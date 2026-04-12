import { test, expect } from '@playwright/test';
import { mockProductApi, mockProductNotFound } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json';

const VALID_BARCODE = vermeiden.barcode;       // 0009800895007 — Hazelnut Spread (nutella)
const INVALID_BARCODE = '9999999999999';
const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

test.describe('Result page (/result/[barcode])', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
  });

  test('loading_state_shown_while_fetching', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/wird geladen/i)).toBeVisible();
  });

  test('error_state_for_invalid_barcode', async ({ page }) => {
    await mockProductNotFound(page, INVALID_BARCODE);
    await page.goto(`/result/${INVALID_BARCODE}`);
    await expect(page.getByText(/nicht gefunden/i)).toBeVisible({ timeout: 5000 });
  });

  test('product_name_and_brand_displayed', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/hazelnut spread/i)).toBeVisible({ timeout: 5000 });
  });

  test('score_scale_with_five_positions_displayed', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    // Score label is shown as main badge text (large, bold)
    await expect(page.getByText('VERMEIDEN')).toBeVisible({ timeout: 5000 });
    // ScoreScale shows 5 dots on the scale (aria-label matches pattern)
    await expect(page.locator('[aria-label^="Bewertungsskala:"]')).toBeVisible({ timeout: 5000 });
  });

  test('score_breakdown_shows_bonus_malus', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText('Bewertungsgründe')).toBeVisible({ timeout: 5000 });
  });

  test('nutrient_table_shows_nutrition_data', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/nährwerte/i)).toBeVisible({ timeout: 5000 });
  });

  test('rescan_button_navigates_to_scanner', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /erneut scannen/i }).click();
    await expect(page).toHaveURL('/scanner');
  });

  test('save_button_stores_to_localStorage', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByRole('button', { name: 'Gespeichert' })).toBeVisible({ timeout: 5000 });
  });

  test('saved_toggle_removes_from_localStorage', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.getByRole('button', { name: /gespeichert/i }).click();
    await expect(page.getByText('Speichern')).toBeVisible({ timeout: 5000 });
  });

  test('saved_state_persists_across_page_reload', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Gespeichert' })).toBeVisible({ timeout: 5000 });
  });

  test('back_to_scanner_link_works_in_error_state', async ({ page }) => {
    await mockProductNotFound(page, INVALID_BARCODE);
    await page.goto(`/result/${INVALID_BARCODE}`);
    await expect(page.getByText(/nicht gefunden/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: /zurück zum scanner/i }).click();
    await expect(page).toHaveURL('/scanner');
  });

  test('ingredients_list_displayed_when_available', async ({ page }) => {
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByRole('heading', { name: 'Zutaten' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/sugar, palm oil, hazelnuts/i)).toBeVisible({ timeout: 5000 });
  });

  test('no_ingredients_info_message_when_ingredientslist_missing', async ({ page }) => {
    const productWithoutIngredients = { ...vermeiden };
    // @ts-expect-error — deliberately removing ingredientsList for test
    delete productWithoutIngredients.ingredientsList;
    await mockProductApi(page, VALID_BARCODE, productWithoutIngredients);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByRole('heading', { name: 'Zutaten' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Es sind keine Zutaten zu dem Produkt gespeichert/i)).toBeVisible({ timeout: 5000 });
  });
});
