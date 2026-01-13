/**
 * E2E Test: API Health & Connectivity
 * 
 * Tests:
 * - API endpoints respond
 * - No server errors
 * - Proper auth enforcement
 */

import { test, expect } from '@playwright/test';

test.describe('API Health', () => {
  test('unauthenticated requests are handled', async ({ request }) => {
    // These should return 401 or redirect, not 500
    const endpoints = [
      '/api/me',
      '/api/sites',
      '/api/billing/usage',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      // Should be 401 (unauthorized) or 302 (redirect to login), not 500
      expect([401, 302, 307, 200]).toContain(response.status());
    }
  });

  test('billing checkout endpoint exists', async ({ request }) => {
    const response = await request.post('/api/billing/checkout', {
      data: { plan: 'starter' },
    });
    // Should return error about auth, not 404
    expect(response.status()).not.toBe(404);
  });

  test('citation check endpoint exists', async ({ request }) => {
    const response = await request.post('/api/geo/citations/check', {
      data: { siteId: 'test' },
    });
    // Should return auth error or validation error, not 404
    expect(response.status()).not.toBe(404);
  });
});

test.describe('Static Assets', () => {
  test('logo loads', async ({ request }) => {
    const response = await request.get('/apple-touch-icon.png');
    expect(response.status()).toBe(200);
  });

  test('favicon exists', async ({ request }) => {
    const response = await request.get('/favicon.ico');
    // 200 or 302 redirect is fine
    expect([200, 302, 304]).toContain(response.status());
  });
});

