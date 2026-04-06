import { test, expect } from '@playwright/test';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

test.describe('Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
  });

  test('homepage_navigates_to_scanner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /jetzt scannen/i }).click();
    await expect(page).toHaveURL('/scanner');
  });

  test('homepage_navigates_to_lebensmittel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /liste/i }).click();
    await expect(page).toHaveURL('/lebensmittel');
  });

  test('bottom_nav_highlights_active_route', async ({ page }) => {
    await page.goto('/');
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toHaveAttribute('aria-current', 'page');

    await page.goto('/scanner');
    await expect(page.getByRole('link', { name: /scanner/i })).toHaveAttribute('aria-current', 'page');

    await page.goto('/lebensmittel');
    await expect(page.getByRole('link', { name: /liste/i })).toHaveAttribute('aria-current', 'page');
  });

  test('all_routes_return_200', async ({ page }) => {
    const routes = ['/', '/scanner', '/lebensmittel', '/einstellungen'];
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    }
  });
});
