import { test, expect } from '@playwright/test';

test.describe('BottomNav Component', () => {
  test('all_3_nav_items_present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /scanner/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /liste/i })).toBeVisible();
  });

  test('active_item_highlighted', async ({ page }) => {
    await page.goto('/');
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toHaveAttribute('aria-current', 'page');

    await page.goto('/scanner');
    const scannerLink = page.getByRole('link', { name: /scanner/i });
    await expect(scannerLink).toHaveAttribute('aria-current', 'page');
  });

  test('navigation_works_via_nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /scanner/i }).click();
    await expect(page).toHaveURL('/scanner');

    await page.getByRole('link', { name: /liste/i }).click();
    await expect(page).toHaveURL('/lebensmittel');

    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL('/');
  });
});
