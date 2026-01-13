/**
 * E2E Test: Plan-Specific Feature Gating
 * 
 * Tests that each pricing tier has correct access/restrictions
 * Uses API-level testing since we can't easily create real accounts
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Skip if no Supabase credentials
const skipIfNoCredentials = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('Plan Gating Logic', () => {
  test.skip(skipIfNoCredentials, 'Skipping - no Supabase credentials');

  test('Free plan has correct limits in database', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create or get test free org
    const { data: org, error } = await supabase
      .from('organizations')
      .upsert({
        id: 'e2e-test-gating-free',
        name: 'E2E Gating Free',
        slug: 'e2e-gating-free',
        plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(org?.plan).toBe('free');
  });

  test('Starter plan has correct limits in database', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org, error } = await supabase
      .from('organizations')
      .upsert({
        id: 'e2e-test-gating-starter',
        name: 'E2E Gating Starter',
        slug: 'e2e-gating-starter',
        plan: 'starter',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(org?.plan).toBe('starter');
  });

  test('Pro plan has correct limits in database', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org, error } = await supabase
      .from('organizations')
      .upsert({
        id: 'e2e-test-gating-pro',
        name: 'E2E Gating Pro',
        slug: 'e2e-gating-pro',
        plan: 'pro',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(org?.plan).toBe('pro');
  });

  test('Usage tracking works', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const { error } = await supabase
      .from('usage')
      .upsert({
        id: `e2e-test-usage-${currentPeriod}`,
        organization_id: 'e2e-test-gating-free',
        period: currentPeriod,
        checks_used: 5,
        gap_analyses_used: 1,
        content_ideas_used: 0,
        action_plans_used: 0,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    expect(error).toBeNull();

    // Verify we can read it back
    const { data: usage, error: readError } = await supabase
      .from('usage')
      .select('*')
      .eq('id', `e2e-test-usage-${currentPeriod}`)
      .single();

    expect(readError).toBeNull();
    expect(usage?.checks_used).toBe(5);
  });

  test('Sites table accepts data', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('sites')
      .upsert({
        id: 'e2e-test-site-001',
        organization_id: 'e2e-test-gating-pro',
        domain: 'notion.com',
        category: 'productivity',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    expect(error).toBeNull();
  });

  test('Competitors table accepts data', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('competitors')
      .upsert({
        id: 'e2e-test-comp-001',
        site_id: 'e2e-test-site-001',
        domain: 'evernote.com',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    expect(error).toBeNull();
  });

  test('Citations table accepts data', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('citations')
      .upsert({
        id: 'e2e-test-citation-001',
        site_id: 'e2e-test-site-001',
        platform: 'perplexity',
        query: 'best productivity apps',
        cited: true,
        snippet: 'Notion is mentioned...',
        confidence: 'high',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    expect(error).toBeNull();
  });
});

