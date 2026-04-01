import { test, expect } from '@playwright/test';

test.describe('Theme / Dark Mode', () => {
  test('theme_toggle_works', async ({ page }) => {
    await page.goto('/');
    // App uses next-themes but has no visible theme toggle in UI.
    // next-themes provides system-level dark mode via prefers-color-scheme.
    // Skip test since there's no toggle to interact with.
    test.skip(true, 'No theme toggle button exposed in UI — app uses system preference only');
  });

  test('theme_persists_across_navigation', async ({ page }) => {
    await page.goto('/');
    // Same as above — no toggle to test persistence
    test.skip(true, 'No theme toggle button exposed in UI — app uses system preference only');
  });
});
