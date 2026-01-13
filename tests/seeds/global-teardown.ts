/**
 * Global Teardown - Runs after all tests
 * Cleans up test data (optional - can be disabled to inspect data)
 */

import { createClient } from '@supabase/supabase-js';

async function globalTeardown() {
  // Skip cleanup if KEEP_TEST_DATA is set
  if (process.env.KEEP_TEST_DATA === 'true') {
    console.log('🧹 Skipping cleanup (KEEP_TEST_DATA=true)');
    return;
  }

  console.log('🧹 Cleaning up E2E test data...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('  ⚠️ Cannot cleanup - missing credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Delete in correct order (children first)
  const tables = ['citations', 'competitors', 'sites', 'usage', 'users', 'organizations'];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .like('id', 'e2e-%');
    
    if (error) {
      console.log(`  ⚠️ Could not clean ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ Cleaned ${table}`);
    }
  }

  console.log('✅ Cleanup complete\n');
}

export default globalTeardown;

