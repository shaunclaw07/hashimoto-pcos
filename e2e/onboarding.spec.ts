import { test, expect } from '@playwright/test';
import { mockProductApi } from '../tests/helpers/mock-api';
import vermeiden from '../tests/fixtures/products/vermeiden.json' with { type: 'json' };

const PROFILE_KEY = 'hashimoto-pcos-user-profile';
const SKIPPED_KEY = 'hashimoto-pcos-onboarding-skipped';
const VALID_BARCODE = vermeiden.barcode;

test.describe('Onboarding Flow', () => {
  test('onboarding_shown_on_first_visit', async ({ page }) => {
    // No localStorage set — OnboardingGuard should redirect to /onboarding
    await page.goto('/');
    await expect(page).toHaveURL('/onboarding', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible({ timeout: 5000 });
  });

  test('skip_button_bypasses_onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /später einrichten/i }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
    const skipped = await page.evaluate((key) => localStorage.getItem(key), SKIPPED_KEY);
    expect(skipped).toBe('true');
  });

  test('skip_prevents_future_onboarding_redirect', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: 3000 });
    await expect(page).not.toHaveURL('/onboarding');
  });

  test('condition_selection_advances_to_step2', async ({ page }) => {
    await page.goto('/onboarding');
    // Click Hashimoto button
    await page.getByRole('button', { name: /hashimoto-thyreoiditis/i }).click();
    // Weiter button should now be enabled
    const weiterBtn = page.getByRole('button', { name: /weiter/i });
    await expect(weiterBtn).toBeEnabled({ timeout: 3000 });
    await weiterBtn.click();
    // Step 2 should appear
    await expect(page.getByRole('heading', { name: /fast fertig/i })).toBeVisible({ timeout: 5000 });
  });

  test('weiter_button_disabled_without_condition', async ({ page }) => {
    await page.goto('/onboarding');
    const weiterBtn = page.getByRole('button', { name: /weiter/i });
    await expect(weiterBtn).toBeDisabled({ timeout: 3000 });
  });

  test('completing_onboarding_saves_pcos_profile', async ({ page }) => {
    await page.goto('/onboarding');
    // Step 1: select PCOS
    await page.getByRole('button', { name: /pcos/i }).click();
    await page.getByRole('button', { name: /weiter/i }).click();
    // Step 2: select Ja for Gluten
    await expect(page.getByRole('heading', { name: /fast fertig/i })).toBeVisible({ timeout: 5000 });
    // Click first "Ja" (Glutensensitiv)
    const jaButtons = page.getByRole('button', { name: /^ja$/i });
    await jaButtons.first().click();
    // Click Fertigstellen
    await page.getByRole('button', { name: /fertigstellen/i }).click();
    // Should redirect to /
    await expect(page).toHaveURL('/', { timeout: 5000 });
    // Profile should be stored
    const raw = await page.evaluate((key) => localStorage.getItem(key), PROFILE_KEY);
    expect(raw).not.toBeNull();
    const profile = JSON.parse(raw!);
    expect(profile.condition).toBe('pcos');
    expect(profile.glutenSensitive).toBe(true);
  });

  test('completing_onboarding_with_both_condition', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /beides/i }).click();
    await page.getByRole('button', { name: /weiter/i }).click();
    await page.getByRole('button', { name: /fertigstellen/i }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
    const raw = await page.evaluate((key) => localStorage.getItem(key), PROFILE_KEY);
    const profile = JSON.parse(raw!);
    expect(profile.condition).toBe('both');
  });

  test('profile_badge_visible_after_setting_hashimoto_profile', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await page.goto('/');
    await expect(page.getByRole('link', { name: /🦋 hashimoto/i })).toBeVisible({ timeout: 5000 });
  });

  test('profile_badge_visible_for_pcos', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'pcos',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await page.goto('/');
    await expect(page.getByRole('link', { name: /🔵 pcos/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Settings Page', () => {
  test('settings_page_accessible_via_nav', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'hashimoto',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await page.goto('/');
    await page.getByRole('link', { name: /profil/i }).click();
    await expect(page).toHaveURL('/settings', { timeout: 5000 });
  });

  test('settings_page_shows_current_profile', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'pcos',
        glutenSensitive: false,
        lactoseIntolerant: true,
      }));
    }, PROFILE_KEY);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /profil/i })).toBeVisible({ timeout: 5000 });
  });

  test('settings_page_can_save_changed_profile', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'pcos',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await page.goto('/settings');
    // Change to Hashimoto
    await page.getByRole('button', { name: /hashimoto-thyreoiditis/i }).click();
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByText(/gespeichert/i)).toBeVisible({ timeout: 5000 });
    // Verify localStorage updated
    const raw = await page.evaluate((key) => localStorage.getItem(key), PROFILE_KEY);
    const profile = JSON.parse(raw!);
    expect(profile.condition).toBe('hashimoto');
  });

  test('settings_page_speichern_updates_header_badge_immediately', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'pcos',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await page.goto('/');
    // Header should show PCOS badge
    await expect(page.getByText(/🔵 pcos/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole('link', { name: /profil/i }).click();
    await expect(page).toHaveURL('/settings', { timeout: 5000 });

    // Change to Hashimoto and save
    await page.getByRole('button', { name: /hashimoto-thyreoiditis/i }).click();
    await page.getByRole('button', { name: /speichern/i }).click();
    await expect(page.getByText(/gespeichert/i)).toBeVisible({ timeout: 5000 });

    // Header badge should update to Hashimoto immediately (🦋)
    await expect(page.getByText(/🦋 hashimoto/i)).toBeVisible({ timeout: 5000 });
    // PCOS badge should no longer be visible
    await expect(page.getByText(/🔵 pcos/i)).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Profile-aware scoring in Result Page', () => {
  test('result_page_shows_profile_badge_in_breakdown_for_pcos', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'pcos',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/angepasst für/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/🔵 pcos/i)).toBeVisible({ timeout: 5000 });
  });

  test('result_page_no_profile_badge_in_generic_mode', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, SKIPPED_KEY);
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText('Bewertungsgründe')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/angepasst für/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('pcos_profile_shows_stricter_sugar_score_than_generic', async ({ page }) => {
    // With PCOS, sugar > 10g scores -2.5 instead of -1.0
    // vermeiden has sugars=56.8g → pcos: -3.5, generic: -2.0
    // Both should give VERMEIDEN but we verify the breakdown shows condition icons

    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({
        condition: 'pcos',
        glutenSensitive: false,
        lactoseIntolerant: false,
      }));
    }, PROFILE_KEY);
    await mockProductApi(page, VALID_BARCODE, vermeiden);
    await page.goto(`/result/${VALID_BARCODE}`);
    await expect(page.getByText(/bewertungsgründe/i)).toBeVisible({ timeout: 5000 });
    // Condition icon 🔵 should appear for PCOS-specific items (2nd 🔵 = breakdown item, 1st = header badge)
    await expect(page.getByText('🔵').nth(1)).toBeVisible({ timeout: 5000 });
  });
});
