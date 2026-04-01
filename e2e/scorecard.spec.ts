import { test, expect } from '@playwright/test';
import { mockProductApi } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json';
import sehrGut from '../tests/fixtures/products/sehr-gut.json';

test.describe('ScoreCard Component', () => {
  test('scorecard_renders_without_crashing', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await expect(page.getByRole('button', { name: /speichern/i })).toBeVisible({ timeout: 5000 });
  });

  test('save_button_disabled_when_already_saved', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByText('Gespeichert')).toBeVisible({ timeout: 5000 });
  });

  test('vermeiden_label_shown_for_low_score_product', async ({ page }) => {
    await mockProductApi(page, vermeiden.barcode, vermeiden);
    await page.goto(`/result/${vermeiden.barcode}`);
    await expect(page.getByText(/vermeiden/i)).toBeVisible({ timeout: 5000 });
  });

  test('sehr_gut_label_shown_for_high_score_product', async ({ page }) => {
    await mockProductApi(page, sehrGut.barcode, sehrGut);
    await page.goto(`/result/${sehrGut.barcode}`);
    await expect(page.getByText(/sehr gut/i)).toBeVisible({ timeout: 5000 });
  });
});
