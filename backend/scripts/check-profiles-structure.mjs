#!/usr/bin/env node

/**
 * Check profiles table structure
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../env/.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('🔍 Checking profiles table structure...\n');
  
  // Try to get table structure
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Error querying profiles table:');
    console.log('   ', error.message);
    console.log('\n📋 Checking if profiles table exists at all...\n');
    
    // Check if table exists using raw SQL
    const { data: tableCheck, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles'
        ORDER BY ordinal_position;
      `
    });
    
    if (tableError) {
      console.log('❌ Cannot check table structure:', tableError.message);
    }
  } else {
    console.log('✅ Profiles table exists!');
    console.log('\n📊 Sample profile data:');
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Check for scan credits
  console.log('\n🔍 Checking scan credits...');
  const { data: creditsData, error: creditsError } = await supabase
    .from('profiles')
    .select('id, scan_credits, scan_credits_reset_at, scan_credits_monthly_bundle')
    .limit(5);
  
  if (creditsError) {
    console.log('❌ Error:', creditsError.message);
  } else {
    console.log('✅ Found', creditsData.length, 'profiles with scan credits:');
    creditsData.forEach(p => {
      console.log('   ID:', p.id);
      console.log('   Credits:', p.scan_credits);
      console.log('   Reset At:', p.scan_credits_reset_at);
      console.log('   Monthly Bundle:', p.scan_credits_monthly_bundle);
      console.log('');
    });
  }
  
  // Check auth.users
  console.log('🔍 Checking auth.users...');
  const { data: authUsers, error: authError } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .limit(5);
  
  if (authError) {
    console.log('❌ Error:', authError.message);
  } else {
    console.log('✅ Found', authUsers.length, 'users:');
    authUsers.forEach(u => {
      console.log('   ID:', u.id);
      console.log('   Email:', u.email || 'N/A');
      console.log('   Display Name:', u.display_name || 'N/A');
      console.log('');
    });
  }
}

checkProfiles().catch(console.error);

