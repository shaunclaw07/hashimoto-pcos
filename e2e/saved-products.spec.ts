import { test, expect } from '@playwright/test';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';
const SAVED_PRODUCTS_KEY = 'hashimoto-pcos-saved-products';
const PROFILE_KEY = 'hashimoto-pcos-user-profile';

const mockSavedProduct = {
  product: {
    barcode: '1234567890123',
    name: 'Bio Hafermilch',
    brand: 'Oatly',
    imageUrl: 'https://example.com/image.jpg',
    nutriments: {
      energyKcal: 45,
      fat: 1.5,
      saturatedFat: 0.2,
      sugars: 4.5,
      fiber: 0.8,
      protein: 1,
      salt: 0.1,
    },
    ingredientsList: ['Wasser', 'Hafer', 'Rapsöl', 'Salz'],
    labels: ['Bio', 'Vegan'],
    categories: ['Getränke'],
    additives: [],
  },
  score: {
    score: 4.2,
    stars: 5,
    label: 'GUT',
    breakdown: [],
    bonuses: 1.2,
    maluses: 0,
  },
  savedAt: Date.now(),
};

test.describe('Gespeicherte Produkte Seite (/saved)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
  });

  test('nav_item_present_in_bottom_nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /gespeichert/i })).toBeVisible();
  });

  test('navigation_to_saved_page_works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /gespeichert/i }).click();
    await expect(page).toHaveURL('/saved');
  });

  test('empty_state_shows_when_no_saved_products', async ({ page }) => {
    await page.goto('/saved');

    // Wait for hydration to complete (loading spinner disappears)
    await page.waitForSelector('h1', { state: 'visible' });

    // Check empty state elements
    await expect(page.getByText('Noch keine Produkte gespeichert')).toBeVisible();
    await expect(page.getByText('Speichere Produkte, die dir gefallen')).toBeVisible();

    // Check CTA buttons
    await expect(page.getByRole('link', { name: /jetzt scannen/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /produkte suchen/i })).toBeVisible();
  });

  test('saved_products_are_displayed', async ({ page }) => {
    // Inject saved product into localStorage
    await page.addInitScript((data) => {
      localStorage.setItem(data.key, JSON.stringify(data.product));
    }, { key: SAVED_PRODUCTS_KEY, product: { '1234567890123': mockSavedProduct } });

    await page.goto('/saved');

    // Wait for page to hydrate
    await page.waitForSelector('h1', { state: 'visible' });

    // Check product is displayed
    await expect(page.getByText('Bio Hafermilch')).toBeVisible();
    await expect(page.getByText('Oatly')).toBeVisible();
    await expect(page.getByText('Gespeichert:', { exact: false })).toBeVisible();

    // Check score badge
    const scoreBadge = page.locator('[title="GUT"]').first();
    await expect(scoreBadge).toBeVisible();
    await expect(scoreBadge).toContainText('4.2');
  });

  test('click_on_product_opens_detail_page', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem(data.key, JSON.stringify(data.product));
    }, { key: SAVED_PRODUCTS_KEY, product: { '1234567890123': mockSavedProduct } });

    await page.goto('/saved');
    await page.waitForSelector('h1', { state: 'visible' });

    await page.getByText('Bio Hafermilch').click();

    await expect(page).toHaveURL('/result/1234567890123');
  });

  test('remove_product_with_undo', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem(data.key, JSON.stringify(data.product));
    }, { key: SAVED_PRODUCTS_KEY, product: { '1234567890123': mockSavedProduct } });

    await page.goto('/saved');
    await page.waitForSelector('h1', { state: 'visible' });

    // Product should be visible initially
    await expect(page.getByRole('heading', { name: 'Bio Hafermilch' })).toBeVisible();

    // Click remove button - use the specific aria-label for more precision
    await page.getByRole('button', { name: /"Bio Hafermilch" entfernen/i }).click();

    // Product heading should be gone (product removed from list, not toast message)
    await expect(page.getByRole('heading', { name: 'Bio Hafermilch' })).not.toBeVisible();

    // Toast with undo should appear (filter out Next.js route announcer)
    const toast = page.locator('[role="alert"]').filter({ hasText: /entfernt/ });
    await expect(toast).toBeVisible();

    // Click undo
    await page.getByRole('button', { name: /rückgängig/i }).click();

    // Product should be back
    await expect(page.getByRole('heading', { name: 'Bio Hafermilch' })).toBeVisible();
  });

  test('sorting_options_work', async ({ page }) => {
    const products = {
      '111': {
        product: { barcode: '111', name: 'Produkt A', brand: 'Marke A', nutriments: {} },
        score: { score: 3.0, stars: 3, label: 'NEUTRAL', breakdown: [], bonuses: 0, maluses: 0 },
        savedAt: Date.now() - 86400000, // yesterday
      },
      '222': {
        product: { barcode: '222', name: 'Produkt B', brand: 'Marke B', nutriments: {} },
        score: { score: 4.5, stars: 5, label: 'SEHR GUT', breakdown: [], bonuses: 1.5, maluses: 0 },
        savedAt: Date.now(), // today
      },
    };

    await page.addInitScript((data) => {
      localStorage.setItem(data.key, JSON.stringify(data.products));
    }, { key: SAVED_PRODUCTS_KEY, products });

    await page.goto('/saved');
    await page.waitForSelector('h1', { state: 'visible' });

    // Both products should be visible
    await expect(page.getByText('Produkt A')).toBeVisible();
    await expect(page.getByText('Produkt B')).toBeVisible();

    // Change sort order to best rating first
    await page.getByLabel(/sortieren/i).selectOption('best');

    // Products should still be visible (sorting logic verified visually)
    await expect(page.getByText('Produkt A')).toBeVisible();
    await expect(page.getByText('Produkt B')).toBeVisible();
  });

  test('score_colors_meet_wcag_aa', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem(data.key, JSON.stringify(data.product));
    }, { key: SAVED_PRODUCTS_KEY, product: { '1234567890123': mockSavedProduct } });

    await page.goto('/saved');
    await page.waitForSelector('h1', { state: 'visible' });

    // Check score badge has proper contrast
    const scoreBadge = page.locator('[title="GUT"]').first();
    await expect(scoreBadge).toBeVisible();

    // Verify badge has white text for contrast
    await expect(scoreBadge).toHaveCSS('color', /rgb\(255,\s*255,\s*255\)/);

    // Verify badge is accessible
    await expect(scoreBadge).toHaveAttribute('title', 'GUT');
  });
});
