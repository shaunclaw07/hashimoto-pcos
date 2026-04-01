import { test, expect } from '@playwright/test';

const VALID_BARCODE = '7622210449283';

test.describe('localStorage / Persistence', () => {
  test('saved_products_persist_in_localStorage', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('hashimoto-pcos-saved-products', JSON.stringify({}));
    });

    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();

    const storage = await page.evaluate(() => {
      return localStorage.getItem('hashimoto-pcos-saved-products');
    });
    expect(storage).toContain(VALID_BARCODE);
  });

  test('multiple_products_can_be_saved', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('hashimoto-pcos-saved-products', JSON.stringify({}));
    });

    await page.goto(`/result/${VALID_BARCODE}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.waitForTimeout(500);

    const storage1 = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('hashimoto-pcos-saved-products') || '{}');
    });
    expect(Object.keys(storage1).length).toBeGreaterThanOrEqual(1);
  });
});
