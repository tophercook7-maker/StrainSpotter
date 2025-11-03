#!/usr/bin/env node

/**
 * Test scan flow and credit system
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

async function testScanFlow() {
  console.log('🔍 Testing Scan Flow...\n');
  
  // 1. Check if scan credit functions exist
  console.log('1️⃣ Checking scan credit functions...');
  try {
    const { data, error } = await supabase.rpc('grant_scan_credits', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Fake ID for test
      p_amount: 0,
      p_reason: 'test'
    });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('❌ grant_scan_credits function NOT found');
      console.log('   Error:', error.message);
      console.log('   ⚠️  You need to run: backend/migrations/20251103_scan_credit_system.sql');
      console.log('   OR: backend/migrations/20251103_fix_scan_credit_profile_id.sql\n');
    } else {
      console.log('✅ grant_scan_credits function exists\n');
    }
  } catch (e) {
    console.log('❌ Error testing grant_scan_credits:', e.message, '\n');
  }
  
  // 2. Check scans table
  console.log('2️⃣ Checking scans table...');
  const { data: scans, error: scansError } = await supabase
    .from('scans')
    .select('id, user_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (scansError) {
    console.log('❌ Error:', scansError.message);
  } else {
    console.log('✅ Scans table exists');
    console.log('   Recent scans:', scans.length);
    scans.forEach(s => {
      console.log('      -', s.id, '| User:', s.user_id || 'N/A', '| Status:', s.status);
    });
    console.log('');
  }
  
  // 3. Check scan_credit_transactions table
  console.log('3️⃣ Checking scan_credit_transactions table...');
  const { data: transactions, error: txError } = await supabase
    .from('scan_credit_transactions')
    .select('id, user_id, amount, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (txError) {
    console.log('❌ Error:', txError.message);
    if (txError.message.includes('does not exist')) {
      console.log('   ⚠️  You need to run: backend/migrations/20251103_scan_credit_system.sql\n');
    }
  } else {
    console.log('✅ scan_credit_transactions table exists');
    console.log('   Recent transactions:', transactions.length);
    transactions.forEach(t => {
      console.log('      -', t.user_id, '| Amount:', t.amount, '| Reason:', t.reason);
    });
    console.log('');
  }
  
  // 4. Check profiles with scan credits
  console.log('4️⃣ Checking profiles with scan credits...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, scan_credits, scan_credits_reset_at')
    .order('scan_credits', { ascending: false })
    .limit(10);
  
  if (profilesError) {
    console.log('❌ Error:', profilesError.message);
  } else {
    console.log('✅ Found', profiles.length, 'profiles:');
    profiles.forEach(p => {
      console.log('      -', p.display_name || 'N/A', '| Credits:', p.scan_credits || 0, '| Reset:', p.scan_credits_reset_at ? 'Yes' : 'No');
    });
    console.log('');
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (scansError || txError) {
    console.log('❌ Some tables or functions are missing');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('   1. Run backend/migrations/20251103_scan_credit_system.sql in Supabase SQL Editor');
    console.log('   2. OR run backend/migrations/20251103_fix_scan_credit_profile_id.sql');
    console.log('   3. Restart backend server');
    console.log('   4. Try scanning again');
  } else {
    console.log('✅ Scan system is set up!');
    console.log('');
    console.log('🔧 If scans still not working, check:');
    console.log('   1. Backend server is running (http://localhost:5181)');
    console.log('   2. Frontend is pointing to correct API_BASE');
    console.log('   3. User has scan credits > 0');
    console.log('   4. Check browser console for errors');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testScanFlow().catch(console.error);

