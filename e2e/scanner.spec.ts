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
    const input = page.locator('input[placeholder*="Barcode"]').first();
    await input.fill('abc123def456');
    await expect(input).toHaveValue('123456');
  });

  test('manual_input_validates_ean13_format', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.locator('input[placeholder*="Barcode"]').first();

    // Valid: 8 digits (EAN-8)
    await input.fill('12345670');
    await expect(input).toHaveValue('12345670');

    // Valid: 13 digits (EAN-13)
    await input.fill('7622210449283');
    await expect(input).toHaveValue('7622210449283');
  });

  test('manual_submit_shows_error_for_invalid_barcode', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    await page.locator('input[placeholder*="Barcode"]').first().fill('123');
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page.getByText(/gültigen barcode/i)).toBeVisible();
  });

  test('scanner_fallback_input_in_camera_mode', async ({ page }) => {
    await page.getByRole('button', { name: /kamera/i }).click();
    // Fallback manual input should be visible in camera mode
    await expect(page.locator('input[placeholder*="Barcode"]').first()).toBeVisible();
  });

  test('reset_clears_error', async ({ page }) => {
    await page.getByRole('button', { name: /manuell/i }).click();
    const input = page.locator('input[placeholder*="Barcode"]').first();
    await input.fill('123');
    await page.getByRole('button', { name: /produkt suchen/i }).click();
    await expect(page.getByText(/gültigen barcode/i)).toBeVisible();

    await input.fill('');
    await expect(page.getByText(/gültigen barcode/i)).not.toBeVisible();
  });
});
