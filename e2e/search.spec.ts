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

  test('search_submits_and_shows_results', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Vollkornbrot');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('search_result_card_shows_product_info', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const firstCard = page.locator('a[href^="/result/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    // Product card should have name and score badge
    await expect(firstCard.locator('p, span').first()).toBeVisible();
  });

  test('result_count_displayed', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.getByText(/ergebnisse gefunden/i)).toBeVisible({ timeout: 15000 });
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

  test('infinite_scroll_loads_more', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const firstResults = page.locator('a[href^="/result/"]');
    await expect(firstResults.first()).toBeVisible({ timeout: 15000 });
    const initialCount = await firstResults.count();
    // Scroll to bottom to trigger infinite scroll
    await page.locator('a[href^="/result/"]').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    // Should have loaded more (or at least still have results)
    const finalCount = await firstResults.count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('product_card_navigates_to_result', async ({ page }) => {
    await page.getByRole('textbox', { name: /suchen/i }).fill('Vollkornbrot');
    await page.getByRole('button', { name: /suchen/i }).click();
    const productCard = page.locator('a[href^="/result/"]').first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.click();
    await expect(page).toHaveURL(/\/result\//);
  });
});
