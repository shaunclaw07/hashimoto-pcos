import { test, expect } from '@playwright/test';

test.describe('Scanner-Seite (/scanner)', () => {
  test.beforeEach(async ({ page }) => {
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
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.getByRole('textbox');
    await input.click();
    // Nutella barcode - should exist in OpenFoodFacts
    await input.type('7622210449283');
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page).toHaveURL(/\/result\/7622210449283/, { timeout: 20000 });
  });

  test('scanner_fallback_input_in_camera_mode', async ({ page }) => {
    await page.getByRole('button', { name: /kamera/i }).click();
    // Fallback manual input should be visible in camera mode
    await expect(page.locator('input[placeholder*="Barcode"]').first()).toBeVisible();
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
