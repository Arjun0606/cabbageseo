/**
 * E2E Test: Marketing Pages
 * 
 * Tests:
 * - Homepage loads with correct content
 * - Pricing page shows all tiers
 * - Docs page is accessible
 * - Footer links work
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with value proposition', async ({ page }) => {
    await page.goto('/');
    
    // Check main headline exists
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check CTA button exists (use first since there may be multiple)
    await expect(page.getByRole('link', { name: /Get Started|See Where|Start/i }).first()).toBeVisible();
    
    // Check navigation
    await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
  });

  test('has footer with required links', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer links
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us' })).toBeVisible();
  });

  test('no fake data or placeholder text', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    
    // Check for common placeholder patterns
    expect(content).not.toContain('lorem ipsum');
    expect(content).not.toContain('TODO');
    expect(content).not.toContain('PLACEHOLDER');
    expect(content).not.toContain('$X,XXX');
    expect(content).not.toContain('XX%');
  });
});

test.describe('Pricing Page', () => {
  test('shows all three tiers', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check all plan names exist (use first() for multiple matches)
    await expect(page.getByRole('heading', { name: 'Free' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Starter' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' }).first()).toBeVisible();
  });

  test('shows correct prices', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check prices are displayed
    await expect(page.getByText('$29').first()).toBeVisible();
    await expect(page.getByText('$79').first()).toBeVisible();
  });

  test('Free plan shows correct limits', async ({ page }) => {
    await page.goto('/pricing');
    
    // Free plan should show:
    await expect(page.getByText('1 site').first()).toBeVisible();
    await expect(page.getByText(/3 manual checks/i).first()).toBeVisible();
  });

  test('Starter plan shows features', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page.getByText('3 sites').first()).toBeVisible();
    await expect(page.getByText(/100 checks/i).first()).toBeVisible();
    await expect(page.getByText(/Daily/i).first()).toBeVisible();
  });

  test('Pro plan shows features', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page.getByText('10 sites').first()).toBeVisible();
    await expect(page.getByText(/1000 checks/i).first()).toBeVisible();
    await expect(page.getByText(/Hourly/i).first()).toBeVisible();
  });

  test('has FAQ section', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page.getByText(/Common questions|FAQ/i).first()).toBeVisible();
  });

  test('CTA buttons link to signup', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check at least one CTA goes to signup
    const signupLinks = page.locator('a[href="/signup"]');
    await expect(signupLinks.first()).toBeVisible();
  });
});

test.describe('Documentation', () => {
  test('docs page loads', async ({ page }) => {
    await page.goto('/docs');
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has methodology section', async ({ page }) => {
    await page.goto('/docs');
    
    // Check for methodology-related content
    await expect(page.getByText(/Methodology|How We Detect|Data/i).first()).toBeVisible();
  });

  test('has FAQ', async ({ page }) => {
    await page.goto('/docs');
    
    await expect(page.getByRole('heading', { name: /FAQ/i }).first()).toBeVisible();
  });

  test('no overclaiming accuracy', async ({ page }) => {
    await page.goto('/docs');
    const content = await page.content();
    
    // Should NOT claim 100% accuracy
    expect(content).not.toMatch(/100%\s*accurate/i);
  });
});

