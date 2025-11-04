#!/usr/bin/env node

/**
 * Run Scan Credit System Migration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../env/.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running Scan Credit System Migration...\n');
  console.log('📝 Please run the SQL migration manually in Supabase SQL Editor:\n');
  console.log('   1. Go to: https://supabase.com/dashboard/project/rdqpxixsbqcsyfewcmbz/sql/new');
  console.log('   2. Copy the contents of: backend/migrations/20251104_scan_credit_system_v2.sql');
  console.log('   3. Paste and run in SQL Editor\n');
  console.log('   OR run this command:');
  console.log('   cat backend/migrations/20251104_scan_credit_system_v2.sql\n');
  console.log('⏳ Waiting for you to run the migration... (press Enter when done)\n');

  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Verify the migration
  console.log('\n🔍 Verifying migration...\n');

  // Check if columns exist
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, scan_credits, membership_tier, scan_credits_used_this_month')
    .limit(1);

  if (profilesError) {
    console.log('❌ Profiles table check failed:', profilesError.message);
  } else {
    console.log('✅ Profiles table has credit columns');
  }

  // Check if transactions table exists
  const { data: transactions, error: transactionsError } = await supabase
    .from('scan_credit_transactions')
    .select('*')
    .limit(1);

  if (transactionsError) {
    console.log('❌ Transactions table check failed:', transactionsError.message);
  } else {
    console.log('✅ Scan credit transactions table exists');
  }

  // Check admin users
  const { data: admins, error: adminsError } = await supabase
    .from('profiles')
    .select('email, membership_tier, scan_credits')
    .in('email', ['topher.cook7@gmail.com', 'andrew.beck@example.com']);

  if (adminsError) {
    console.log('❌ Admin check failed:', adminsError.message);
  } else {
    console.log('✅ Admin users configured:');
    admins.forEach(admin => {
      console.log(`   - ${admin.email}: ${admin.membership_tier} (${admin.scan_credits} credits)`);
    });
  }

  console.log('\n✨ Migration verification complete!\n');
}

runMigration().catch((e) => {
  console.error('❌ Migration failed:', e.message || e);
  process.exit(1);
});

