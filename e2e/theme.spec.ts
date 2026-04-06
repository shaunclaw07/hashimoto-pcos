import { test, expect } from '@playwright/test';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

test.describe('Theme / Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
  });

  test('theme_toggle_works', async ({ page }) => {
    // App uses next-themes with system preference — no UI toggle.
    // Test that system dark mode preference is applied to <html> element.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    // next-themes adds class="dark" to <html> when system prefers dark
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 3000 });
  });

  test('theme_persists_across_navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 3000 });

    await page.goto('/scanner');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.goto('/products');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
