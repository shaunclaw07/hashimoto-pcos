import { test, expect } from '@playwright/test';

test.describe('Startseite (/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hero_cta_button_exists', async ({ page }) => {
    await expect(page.getByRole('link', { name: /jetzt scannen/i })).toBeVisible();
  });

  test('feature_cards_render', async ({ page }) => {
    await expect(page.getByText('Barcode scannen')).toBeVisible();
    await expect(page.getByText('Lebensmittel suchen')).toBeVisible();
    await expect(page.getByText('Wissenschaftlich fundiert')).toBeVisible();
  });

  test('score_legend_shows_all_5_levels', async ({ page }) => {
    await expect(page.getByText('Sehr gut')).toBeVisible();
    await expect(page.getByText('Gut')).toBeVisible();
    await expect(page.getByText('Neutral')).toBeVisible();
    await expect(page.getByText('Weniger gut')).toBeVisible();
    await expect(page.getByText('Vermeiden')).toBeVisible();
  });

  test('bottom_nav_present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /scanner/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /liste/i })).toBeVisible();
  });
});
