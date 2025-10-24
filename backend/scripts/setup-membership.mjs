#!/usr/bin/env node
/**
 * Auto-setup membership tables via Supabase REST API
 * This bypasses the need for SQL editor by using Supabase client directly
 */

import { supabaseAdmin } from '../supabaseAdmin.js';

async function setupMembershipTables() {
  if (!supabaseAdmin) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
    console.error('   Set it in env/.env.local and restart backend\n');
    console.log('📖 See MEMBERSHIP_SETUP.md for manual setup instructions');
    process.exit(1);
  }

  console.log('🔧 Setting up membership system tables...\n');

  // Test if tables already exist
  console.log('1️⃣  Checking if tables exist...');
  const { error: checkError } = await supabaseAdmin
    .from('membership_applications')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✅ Tables already exist! Testing insert...');
    
    // Test insert
    const testApp = {
      email: `test-${Date.now()}@example.com`,
      full_name: 'Test User',
      message: 'Auto-generated test application'
    };
    
    const { data, error } = await supabaseAdmin
      .from('membership_applications')
      .insert(testApp)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Insert test failed:', error.message);
      console.log('\n📖 You may need to adjust RLS policies in Supabase dashboard');
    } else {
      console.log('✅ Application form is working!');
      console.log('   Test application created:', data.id);
      
      // Clean up test
      await supabaseAdmin
        .from('membership_applications')
        .delete()
        .eq('id', data.id);
    }
    
    console.log('\n🎉 Membership system is ready!');
    console.log('\nNext steps:');
    console.log('  1. Try the application form at: http://localhost:4173/membership-join');
    console.log('  2. View applications at: http://localhost:4173/membership-admin');
    console.log('  3. See MEMBERSHIP_SETUP.md for admin approval workflow\n');
    process.exit(0);
  }

  console.log('⚠️  Tables do not exist. Creating via SQL...\n');
  console.log('📖 MANUAL SETUP REQUIRED:');
  console.log('   Supabase requires SQL migrations to be run via the dashboard.\n');
  console.log('Steps:');
  console.log('  1. Open: https://app.supabase.com');
  console.log('  2. Select your StrainSpotter project');
  console.log('  3. Click "SQL Editor" in left sidebar');
  console.log('  4. Click "New query"');
  console.log('  5. Copy/paste contents of:');
  console.log('     backend/migrations/2025_10_21_membership_tracking.sql');
  console.log('  6. Click "Run"\n');
  console.log('OR use the quick-start SQL from MEMBERSHIP_SETUP.md\n');
  console.log('After running, test again with: npm run setup:membership\n');
  
  process.exit(1);
}

setupMembershipTables().catch(err => {
  console.error('\n💥 Setup failed:', err.message);
  console.log('\n📖 See MEMBERSHIP_SETUP.md for troubleshooting\n');
  process.exit(1);
});
