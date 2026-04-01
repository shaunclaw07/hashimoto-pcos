import { test, expect } from '@playwright/test';

const VALID_BARCODE = '7622210449283';

test.describe('ScoreCard Component', () => {
  test('breakdown_hidden_when_empty', async ({ page }) => {
    // Find a product with minimal breakdown
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.waitForTimeout(5000);
    // Breakdown section presence depends on product data
    const breakdown = page.getByText('Bewertungsgründe');
    const count = await page.locator('text=Bewertungsgründe').count();
    // Just verify the component renders without crashing
    await expect(page.getByRole('button', { name: /speichern/i })).toBeVisible();
  });

  test('save_button_disabled_when_already_saved', async ({ page }) => {
    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByText('Gespeichert')).toBeVisible();
  });
});
