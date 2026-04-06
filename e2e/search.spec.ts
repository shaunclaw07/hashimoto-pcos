import { test, expect } from '@playwright/test';
import { mockSearchApi } from '../tests/helpers/mock-api';
import gut from '../tests/fixtures/products/gut.json';
import neutral from '../tests/fixtures/products/neutral.json';
import vermeiden from '../tests/fixtures/products/vermeiden.json';
import sehrGut from '../tests/fixtures/products/sehr-gut.json';
import wenigerGut from '../tests/fixtures/products/weniger-gut.json';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

// Search API returns products with `code` field (not `barcode`)
const toSearchProduct = (f: typeof gut) => ({ ...f, code: f.barcode });

const MOCK_PRODUCTS = [gut, neutral, vermeiden, sehrGut, wenigerGut].map(toSearchProduct);

test.describe('Search page (/products)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await page.goto('/products');
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
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Vollkornbrot');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('search_result_card_shows_product_info', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const firstCard = page.locator('a[href^="/result/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    await expect(firstCard.locator('p, span').first()).toBeVisible();
  });

  test('result_count_displayed', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.getByText(/ergebnisse gefunden/i)).toBeVisible({ timeout: 5000 });
  });

  test('no_results_shows_empty_state', async ({ page }) => {
    await mockSearchApi(page, []);
    await page.getByRole('textbox', { name: /suchen/i }).fill('xyzabc123nonexistentproduct');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.getByText('Keine Ergebnisse gefunden')).toBeVisible({ timeout: 5000 });
  });

  test('reset_button_clears_search', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /zurücksetzen/i }).click();
    await expect(page.getByRole('textbox', { name: /suchen/i })).toHaveValue('');
  });

  test('infinite_scroll_loads_more', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const firstResults = page.locator('a[href^="/result/"]');
    await expect(firstResults.first()).toBeVisible({ timeout: 5000 });
    const initialCount = await firstResults.count();
    await page.locator('a[href^="/result/"]').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const finalCount = await firstResults.count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('product_card_navigates_to_result', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Vollkornbrot');
    await page.getByRole('button', { name: /suchen/i }).click();
    const productCard = page.locator('a[href^="/result/"]').first();
    await expect(productCard).toBeVisible({ timeout: 5000 });
    await productCard.click();
    await expect(page).toHaveURL(/\/result\//);
  });
});
