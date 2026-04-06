import { test, expect } from '@playwright/test';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';
const PROFILE_KEY = 'hashimoto-pcos-user-profile';

test.describe('BottomNav Component', () => {
  test('all_4_nav_items_present', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await page.goto('/');
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /scanner/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /liste/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /profil/i })).toBeVisible();
  });

  test('active_item_highlighted', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await page.goto('/');
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toHaveAttribute('aria-current', 'page');

    await page.goto('/scanner');
    const scannerLink = page.getByRole('link', { name: /scanner/i });
    await expect(scannerLink).toHaveAttribute('aria-current', 'page');
  });

  test('navigation_works_via_nav', async ({ page }) => {
    // Set a full profile so /settings renders without errors
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);

    // Test each nav link from a fresh known-good page to avoid dev-overlay accumulation
    await page.goto('/');
    await page.getByRole('link', { name: /scanner/i }).click();
    await expect(page).toHaveURL('/scanner');

    await page.goto('/');
    await page.getByRole('link', { name: /liste/i }).click();
    await expect(page).toHaveURL('/products');

    await page.goto('/');
    await page.getByRole('link', { name: /profil/i }).click();
    await expect(page).toHaveURL('/settings');

    await page.goto('/scanner');
    // The Next.js dev tools portal (bottom-left) overlaps the Home nav link in dev mode.
    // Use evaluate to dispatch the click directly on the DOM element, bypassing the overlay.
    await page.evaluate(() => {
      (document.querySelector('a[href="/"][aria-label="Home"]') as HTMLAnchorElement)?.click();
    });
    await expect(page).toHaveURL('/');
  });

  test('nav_hidden_on_onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByRole('navigation')).not.toBeVisible();
  });
});
