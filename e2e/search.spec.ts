import { test, expect } from '@playwright/test';

test.describe('Suchseite (/lebensmittel)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lebensmittel');
  });

  test('empty_state_before_search', async ({ page }) => {
    await expect(page.getByText('Lebensmittel suchen')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /suchen/i })).toBeVisible();
  });

  test('search_input_accepts_text', async ({ page }) => {
    const input = page.getByRole('textbox', { name: /suchen/i });
    await input.fill('Milch');
    await expect(input).toHaveValue('Milch');
  });

  test('category_filters_selectable', async ({ page }) => {
    const categories = ['Alle', 'Gemüse', 'Obst', 'Fleisch', 'Fisch', 'Milchprodukte', 'Getreide', 'Snacks'];
    for (const cat of categories) {
      await expect(page.getByRole('button', { name: cat })).toBeVisible();
    }
  });

  test('no_results_shows_empty_state', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('xyzabc123nonexistentproduct');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.getByText('Keine Ergebnisse gefunden')).toBeVisible({ timeout: 15000 });
  });

  test('reset_button_clears_search', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await page.getByByRole('button', { name: /zurücksetzen/i }).click();
    await expect(page.getByRole('textbox', { name: /suchen/i })).toHaveValue('');
  });

  test('product_card_navigates_to_result', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Vollkornbrot');
    await page.getByRole('button', { name: /suchen/i }).click();

    // Wait for results
    const productCard = page.locator('a[href^="/result/"]').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
  });
});
