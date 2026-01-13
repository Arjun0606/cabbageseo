/**
 * Global Setup - Runs before all tests
 * Creates test users and organizations for each tier
 */

import { createClient } from '@supabase/supabase-js';

// Test user credentials - using proper UUIDs
export const TEST_USERS = {
  free: {
    email: 'test-free@cabbageseo-test.com',
    password: 'TestPass123!',
    name: 'Test Free User',
    orgId: 'e2e00000-0000-0000-0000-000000000001',
    plan: 'free' as const,
  },
  starter: {
    email: 'test-starter@cabbageseo-test.com',
    password: 'TestPass123!',
    name: 'Test Starter User',
    orgId: 'e2e00000-0000-0000-0000-000000000002',
    plan: 'starter' as const,
  },
  pro: {
    email: 'test-pro@cabbageseo-test.com',
    password: 'TestPass123!',
    name: 'Test Pro User',
    orgId: 'e2e00000-0000-0000-0000-000000000003',
    plan: 'pro' as const,
  },
};

// Test site - using notion.com as it's well-known and AI definitely mentions it
export const TEST_SITE = {
  domain: 'notion.com',
  category: 'productivity',
};

async function globalSetup() {
  console.log('🧪 Setting up E2E test environment...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create test organizations
  for (const [tier, user] of Object.entries(TEST_USERS)) {
    console.log(`  Creating ${tier} organization...`);
    
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: user.orgId,
        name: `E2E Test ${tier.charAt(0).toUpperCase() + tier.slice(1)} Org`,
        slug: `e2e-test-${tier}`,
        plan: user.plan,
        subscription_status: 'active',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (orgError) {
      console.error(`  ❌ Failed to create ${tier} org:`, orgError.message);
    } else {
      console.log(`  ✅ ${tier} organization ready`);
    }
  }

  // Create usage records for current period - using proper UUIDs
  const usageIds = {
    free: 'e2e00000-0000-0000-0000-000000000041',
    starter: 'e2e00000-0000-0000-0000-000000000042',
    pro: 'e2e00000-0000-0000-0000-000000000043',
  };
  const currentPeriod = new Date().toISOString().slice(0, 7);
  
  for (const [tier, user] of Object.entries(TEST_USERS)) {
    const { error: usageError } = await supabase
      .from('usage')
      .upsert({
        id: usageIds[tier as keyof typeof usageIds],
        organization_id: user.orgId,
        period: currentPeriod,
        checks_used: 0,
        gap_analyses_used: 0,
        content_ideas_used: 0,
        action_plans_used: 0,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (usageError) {
      console.error(`  ❌ Failed to create ${tier} usage:`, usageError.message);
    }
  }

  console.log('✅ E2E test environment ready\n');
}

export default globalSetup;

