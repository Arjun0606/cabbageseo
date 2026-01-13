/**
 * E2E Test: Data Integrity
 * 
 * Tests that no fake/mock data is displayed
 * Enforces SYSTEM.md truth rules
 */

import { test, expect } from '@playwright/test';

test.describe('Data Integrity - No Fake Data', () => {
  
  test('Homepage has no placeholder dollar amounts', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    
    // Should not have fake dollar amounts
    expect(content).not.toMatch(/\$\d{1,3}k\/mo/i); // No $XXk/mo claims
    expect(content).not.toMatch(/\$\d{4,}.*revenue/i); // No fake revenue numbers
    expect(content).not.toContain('$X,XXX');
    expect(content).not.toContain('$XX,XXX');
  });

  test('Pricing page shows real prices only', async ({ page }) => {
    await page.goto('/pricing');
    const content = await page.content();
    
    // Should have real prices
    expect(content).toContain('$29');
    expect(content).toContain('$79');
    
    // Should not have placeholder prices
    expect(content).not.toContain('$XX');
    expect(content).not.toContain('$X.XX');
  });

  test('No lorem ipsum anywhere', async ({ page }) => {
    const pagesToCheck = ['/', '/pricing', '/docs', '/login', '/signup'];
    
    for (const path of pagesToCheck) {
      await page.goto(path);
      const content = await page.content();
      expect(content.toLowerCase()).not.toContain('lorem ipsum');
      expect(content.toLowerCase()).not.toContain('dolor sit amet');
    }
  });

  test('No TODO or FIXME in public content', async ({ page }) => {
    const pagesToCheck = ['/', '/pricing', '/docs'];
    
    for (const path of pagesToCheck) {
      await page.goto(path);
      const content = await page.content();
      // Visible text should not have TODOs
      const visibleText = await page.locator('body').textContent();
      expect(visibleText?.toUpperCase()).not.toContain('TODO');
      expect(visibleText?.toUpperCase()).not.toContain('FIXME');
    }
  });

  test('Docs mentions confidence levels', async ({ page }) => {
    await page.goto('/docs');
    const content = await page.content();
    
    // Should explain confidence levels per SYSTEM.md
    expect(content.toLowerCase()).toContain('high');
    expect(content.toLowerCase()).toContain('medium');
    expect(content.toLowerCase()).toContain('low');
    expect(content.toLowerCase()).toContain('confidence');
  });

  test('No overclaiming on homepage', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    
    // Should not claim specific percentages without data
    expect(content).not.toMatch(/\d+% of all searches/i);
    expect(content).not.toMatch(/guaranteed.*results/i);
  });
});

test.describe('Data Integrity - Proper Labeling', () => {
  test('Pricing page distinguishes Free limitations', async ({ page }) => {
    await page.goto('/pricing');
    const content = await page.content();
    
    // Free plan should clearly show limitations
    expect(content.toLowerCase()).toContain('manual');
    expect(content.toLowerCase()).toContain('no');
  });

  test('Docs has methodology section', async ({ page }) => {
    await page.goto('/docs');
    const content = await page.content();
    
    // Should explain how data is collected
    expect(content.toLowerCase()).toContain('methodology');
  });
});

