import { test, expect } from '@playwright/test';

const VALID_BARCODE = '7622210449283'; // Nutella
const INVALID_BARCODE = '9999999999999';

test.describe('Ergebnisseite (/result/[barcode])', () => {
  test('loading_state_shown_while_fetching', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/wird geladen/i)).toBeVisible();
  });

  test('error_state_for_invalid_barcode', async ({ page }) => {
    await page.goto(`/result/${INVALID_BARCODE}`);
    await expect(page.getByText(/nicht gefunden/i)).toBeVisible({ timeout: 15000 });
  });

  test('product_name_and_brand_displayed', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/Nutella/i)).toBeVisible({ timeout: 20000 });
  });

  test('score_badge_with_stars_displayed', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    // Check for score label text instead of fragile CSS class
    await expect(
      page.getByText(/sehr gut|gut|neutral|weniger gut|vermeiden/i)
    ).toBeVisible({ timeout: 20000 });
    // Also verify star icons are rendered (5 stars in the rating)
    await expect(page.locator('.fill-current')).toHaveCount(5, { timeout: 20000 });
  });

  test('score_breakdown_shows_bonus_malus', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText('Bewertungsgründe')).toBeVisible({ timeout: 20000 });
  });

  test('nutrient_table_shows_nutrition_data', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/nährwerte/i)).toBeVisible({ timeout: 20000 });
  });

  test('rescan_button_navigates_to_scanner', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /erneut scannen/i }).click();
    await expect(page).toHaveURL('/scanner');
  });

  test('save_button_stores_to_localStorage', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByText('Gespeichert')).toBeVisible({ timeout: 10000 });
  });

  test('saved_toggle_removes_from_localStorage', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.getByRole('button', { name: /gespeichert/i }).click();
    await expect(page.getByText('Speichern')).toBeVisible({ timeout: 10000 });
  });

  test('saved_state_persists_across_page_reload', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.reload();
    await expect(page.getByText('Gespeichert')).toBeVisible({ timeout: 10000 });
  });

  test('back_to_scanner_link_works', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('link', { name: /zurück zum scanner/i }).click();
    await expect(page).toHaveURL('/scanner');
  });
});
