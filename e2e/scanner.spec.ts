import { test, expect } from '@playwright/test';
import { mockProductApi, mockProductNotFound } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json';

const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';

test.describe('Scanner page (/scanner)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await page.goto('/scanner');
  });

  test('mode_toggle_switches_between_camera_and_manual', async ({ page }) => {
    await page.getByRole('button', { name: /kamera/i }).click();
    await expect(page.getByRole('button', { name: /kamera/i })).toHaveClass(/bg-primary/);

    await page.getByRole('button', { name: /manuell/i }).click();
    await expect(page.getByRole('button', { name: /manuell/i })).toHaveClass(/bg-primary/);
  });

  test('manual_input_accepts_only_digits', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    // Use click() + type() instead of fill() to avoid React state race conditions
    await input.click();
    await input.type('abc123def456');
    await expect(input).toHaveValue('123456');
  });

  test('manual_input_validates_ean13_format', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    await input.type('7622210449283');
    await expect(input).toHaveValue('7622210449283');
  });

  test('manual_submit_shows_error_for_invalid_barcode', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    await input.type('123');
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page.getByText(/gültigen barcode/i)).toBeVisible();
  });

  test('manual_submit_navigates_to_result', async ({ page }) => {
    const barcode = vermeiden.barcode;
    await mockProductApi(page, barcode, vermeiden);
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    await input.type(barcode);
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page).toHaveURL(new RegExp(`/result/${barcode}`), { timeout: 10000 });
  });

  test('manual_submit_uses_internal_api_not_off_directly', async ({ page }) => {
    const barcode = vermeiden.barcode;
    let offCallMade = false;
    await page.route('**/openfoodfacts.org/**', () => { offCallMade = true; });
    await mockProductApi(page, barcode, vermeiden);
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    await input.type(barcode);
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page).toHaveURL(new RegExp(`/result/${barcode}`), { timeout: 10000 });
    expect(offCallMade).toBe(false);
  });

  test('manual_submit_shows_error_for_unknown_barcode', async ({ page }) => {
    const barcode = '9999999999999';
    await mockProductNotFound(page, barcode);
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    await input.type(barcode);
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page.getByText(/nicht gefunden/i)).toBeVisible({ timeout: 5000 });
  });

  test('reset_clears_error', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    await input.type('123');
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page.getByText(/gültigen barcode/i)).toBeVisible();

    await input.fill('');
    await expect(page.getByText(/gültigen barcode/i)).not.toBeVisible();
  });
});
