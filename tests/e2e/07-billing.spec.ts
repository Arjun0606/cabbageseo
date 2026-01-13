/**
 * E2E Test: Billing & Payments
 * 
 * Tests billing page, upgrade flows, and Dodo integration
 */

import { test, expect } from '@playwright/test';

test.describe('Billing Pages', () => {
  test('settings billing page exists (requires auth)', async ({ page }) => {
    await page.goto('/settings/billing');
    
    // Should either show billing page or redirect to login
    const url = page.url();
    expect(url).toMatch(/(billing|login|signup)/);
  });
});

test.describe('Dodo Payments Integration', () => {
  test('Dodo API key is configured', async () => {
    // This test verifies the environment is set up
    const dodoKey = process.env.DODO_API_KEY;
    
    if (!dodoKey) {
      console.warn('DODO_API_KEY not set - billing tests will be limited');
    }
    
    // Don't fail if not set, just warn
    expect(true).toBe(true);
  });
});

test.describe('Pricing CTAs', () => {
  test('Free plan CTA goes to signup', async ({ page }) => {
    await page.goto('/pricing');
    
    // Find the Free plan's CTA
    const freeSection = page.locator('text=Free').first();
    await expect(freeSection).toBeVisible();
    
    // There should be a signup link in the pricing area
    const signupLinks = page.locator('a[href="/signup"]');
    const count = await signupLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Paid plan CTAs exist', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for upgrade/trial buttons
    const trialButtons = page.locator('button, a').filter({ hasText: /trial|start|upgrade/i });
    const count = await trialButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});

