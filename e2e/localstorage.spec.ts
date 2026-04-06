import { test, expect } from '@playwright/test';
import { mockProductApi } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json';
import gut from '../tests/fixtures/products/gut.json';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

test.describe('localStorage / Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
  });

  test('saved_products_persist_in_localStorage', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('hashimoto-pcos-saved-products', JSON.stringify({}));
    });

    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await page.getByRole('button', { name: /speichern/i }).click();

    const storage = await page.evaluate(() =>
      localStorage.getItem('hashimoto-pcos-saved-products')
    );
    expect(storage).toContain(vermeiden.barcode);
  });

  test('multiple_products_can_be_saved', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.waitForTimeout(300);

    await mockProductApi(page, gut.barcode, gut);
    await page.goto(`/result/${gut.barcode}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.waitForTimeout(300);

    const storage = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('hashimoto-pcos-saved-products') || '{}')
    );
    expect(Object.keys(storage).length).toBeGreaterThanOrEqual(2);
  });

  test('removing_product_clears_from_localStorage', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('hashimoto-pcos-saved-products', JSON.stringify({}));
    });

    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await page.getByRole('button', { name: /gespeichert/i }).click();

    const storage = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('hashimoto-pcos-saved-products') || '{}')
    );
    expect(Object.keys(storage)).not.toContain(vermeiden.barcode);
  });
});
