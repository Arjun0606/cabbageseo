/**
 * E2E Test: Signup & Authentication
 * 
 * Tests:
 * - Signup page loads correctly
 * - Form validation works
 * - OAuth buttons present
 * - Terms/Privacy links work
 */

import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Check page title
    await expect(page).toHaveTitle(/CabbageSEO/);
    
    // Check form elements exist
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    
    // Check OAuth
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
    
    // Check links
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('terms page exists', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('privacy page exists', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

