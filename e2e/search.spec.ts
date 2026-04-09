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
    // Page 1: exactly PAGE_SIZE (50) products → hasMore = true
    const page1Products = Array.from({ length: 50 }, (_, i) => ({
      ...gut,
      barcode: `000000000${String(i).padStart(4, '0')}`,
      code: `000000000${String(i).padStart(4, '0')}`,
    }));
    // Page 2: fewer than PAGE_SIZE → hasMore = false
    const page2Products = [{ ...neutral, code: neutral.barcode }];

    await page.route('**/api/products/search*', async (route) => {
      const url = new URL(route.request().url());
      const p = url.searchParams.get('page') ?? '1';
      const products = p === '1' ? page1Products : page2Products;
      await route.fulfill({
        json: { products, count: 51, page: Number(p), hasMore: p === '1' },
      });
    });

    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 5000 });
    const initialCount = await page.locator('a[href^="/result/"]').count();
    expect(initialCount).toBe(50);

    await page.locator('a[href^="/result/"]').last().scrollIntoViewIfNeeded();
    await expect(page.locator('a[href^="/result/"]')).toHaveCount(51, { timeout: 5000 });
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

  test('search_results_persist_after_back_navigation', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    const input = page.getByRole('textbox', { name: /suchen/i });
    await input.fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const results = page.locator('a[href^="/result/"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    // Verify sessionStorage is populated
    const ssAfterSearch = await page.evaluate(() =>
      sessionStorage.getItem('search-results:Milch:all') !== null
    );
    expect(ssAfterSearch).toBe(true);

    const countBeforeNav = await results.count();
    expect(countBeforeNav).toBeGreaterThan(0);

    // Wait for URL to reflect the search (router.push is async in Next.js App Router)
    await expect(page).toHaveURL(/\?q=Milch/);

    // Navigate to a product detail page
    await results.first().click();
    await expect(page).toHaveURL(/\/result\//);

    // Press browser Back — this triggers popstate, NOT a full page reload
    await page.goBack();
    await expect(page).toHaveURL(/\/products/);

    // Popstate listener restores results from sessionStorage
    await page.waitForFunction(
      () => document.querySelectorAll('a[href^="/result/"]').length > 0,
      { timeout: 10000 }
    );
    const countAfterBack = await page.locator('a[href^="/result/"]').count();
    expect(countAfterBack).toBe(countBeforeNav);
  });

  test('search_url_updated_after_search', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const results = page.locator('a[href^="/result/"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
    // URL should contain the search query
    await expect(page).toHaveURL(/\?q=Milch/);
  });

  test('search_results_persist_after_page_reload', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    const results = page.locator('a[href^="/result/"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    const countBeforeReload = await results.count();

    // Wait for URL to reflect the search (router.push is async in Next.js App Router)
    await expect(page).toHaveURL(/\?q=Milch/);

    // Reload the page — sessionStorage persists across reloads in the same tab
    // The mount effect reads ?q=Milch from URL and restores from sessionStorage
    await page.reload();

    // Results should be restored from sessionStorage (C3 fix)
    await page.waitForFunction(
      () => document.querySelectorAll('a[href^="/result/"]').length > 0,
      { timeout: 10000 }
    );
    const countAfterReload = await page.locator('a[href^="/result/"]').count();
    expect(countAfterReload).toBe(countBeforeReload);
  });

  test('search_url_reflects_current_search', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Vollkornbrot');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 10000 });

    // URL should contain search params
    await expect(page).toHaveURL(/\?q=Vollkornbrot/);
  });

  test('search_results_cleared_on_new_search', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    const input = page.getByRole('textbox', { name: /suchen/i });

    // First search: Milch
    await input.fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 10000 });

    // Second search: Brot (different query)
    await mockSearchApi(page, [gut]);
    await input.fill('Brot');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 10000 });

    // URL should reflect the new search
    await expect(page).toHaveURL(/q=Brot/);
  });

  test('category_switch_clears_previous_results', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('textbox', { name: /suchen/i }).fill('Milch');
    await page.getByRole('button', { name: /suchen/i }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 5000 });

    // Switch category — unroute the previous handler first to avoid Playwright route ordering issues
    await page.unroute('**/api/products/search*');
    await mockSearchApi(page, [gut]);
    await page.getByRole('button', { name: 'Gemüse' }).click();

    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 5000 });

    // All displayed hrefs must be unique (no duplicate keys)
    const hrefs = await page.locator('a[href^="/result/"]').evaluateAll(
      (els) => els.map((el) => el.getAttribute('href'))
    );
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
    expect(hrefs.length).toBe(1); // only the newly mocked product
  });

  test('category_click_without_prior_search_shows_results', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('button', { name: 'Gemüse' }).click();
    await expect(page.locator('a[href^="/result/"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('category_switch_updates_active_highlight', async ({ page }) => {
    await mockSearchApi(page, MOCK_PRODUCTS);
    await page.getByRole('button', { name: 'Gemüse' }).click();
    await expect(page.getByRole('button', { name: 'Gemüse' })).toHaveClass(/bg-primary/);
    // Ensure previously-active "Alle" loses its highlight (mutual exclusivity)
    await expect(page.getByRole('button', { name: 'Alle' })).not.toHaveClass(/bg-primary/);
  });
});
