#!/usr/bin/env node

/**
 * Check Grower Directory Database Setup
 * 
 * This script checks if the Grower Directory migration has been run
 * and shows the current state of the database.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from ../env/.env.local
dotenv.config({ path: join(__dirname, '../../env/.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('SUPABASE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  console.log('\nMake sure env/.env.local has SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Grower Directory Database Setup...\n');
  
  // Check if grower columns exist in profiles table
  console.log('1️⃣ Checking profiles table for grower columns...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, is_grower, grower_farm_name, grower_experience_years')
    .limit(1);
  
  if (profileError) {
    console.log('❌ Grower columns NOT found in profiles table');
    console.log('   Error:', profileError.message);
    console.log('   ⚠️  You need to run: backend/migrations/2025_grower_directory_messaging.sql\n');
  } else {
    console.log('✅ Grower columns exist in profiles table\n');
  }
  
  // Check if conversations table exists
  console.log('2️⃣ Checking conversations table...');
  const { data: convos, error: convoError } = await supabase
    .from('conversations')
    .select('id')
    .limit(1);
  
  if (convoError) {
    console.log('❌ Conversations table NOT found');
    console.log('   Error:', convoError.message);
    console.log('   ⚠️  You need to run: backend/migrations/2025_grower_directory_messaging.sql\n');
  } else {
    console.log('✅ Conversations table exists\n');
  }
  
  // Check if messages table exists
  console.log('3️⃣ Checking messages table...');
  const { data: msgs, error: msgError } = await supabase
    .from('messages')
    .select('id')
    .limit(1);
  
  if (msgError) {
    console.log('❌ Messages table NOT found');
    console.log('   Error:', msgError.message);
    console.log('   ⚠️  You need to run: backend/migrations/2025_grower_directory_messaging.sql\n');
  } else {
    console.log('✅ Messages table exists\n');
  }
  
  // Check if moderators table exists
  console.log('4️⃣ Checking moderators table...');
  const { data: mods, error: modError } = await supabase
    .from('moderators')
    .select('user_id, permissions, is_active')
    .limit(5);
  
  if (modError) {
    console.log('❌ Moderators table NOT found');
    console.log('   Error:', modError.message);
    console.log('   ⚠️  You need to run: backend/migrations/2025_grower_directory_messaging.sql\n');
  } else {
    console.log('✅ Moderators table exists');
    if (mods && mods.length > 0) {
      console.log('   📋 Current moderators:', mods.length);
      mods.forEach(m => console.log('      -', m.user_id, '(active:', m.is_active + ')'));
    } else {
      console.log('   ⚠️  No moderators set up yet');
    }
    console.log('');
  }
  
  // Check all users
  console.log('5️⃣ Checking all user profiles...');
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('id, display_name, is_grower, grower_farm_name, grower_listed_in_directory, scan_credits')
    .order('created_at', { ascending: false });
  
  if (allError) {
    console.log('❌ Could not fetch profiles');
    console.log('   Error:', allError.message);
  } else {
    console.log('✅ Found', allProfiles.length, 'user profile(s):\n');
    allProfiles.forEach((p, i) => {
      console.log('   User', i + 1 + ':');
      console.log('      ID:', p.id);
      console.log('      Display Name:', p.display_name || '❌ NOT SET');
      console.log('      Is Grower:', p.is_grower || false);
      console.log('      Farm Name:', p.grower_farm_name || 'N/A');
      console.log('      In Directory:', p.grower_listed_in_directory || false);
      console.log('      Scan Credits:', p.scan_credits || 0);
      console.log('');
    });
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const migrationNeeded = profileError || convoError || msgError || modError;
  
  if (migrationNeeded) {
    console.log('❌ Migration NOT complete');
    console.log('');
    console.log('🔧 NEXT STEP:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of: backend/migrations/2025_grower_directory_messaging.sql');
    console.log('   3. Paste and RUN in SQL Editor');
    console.log('   4. Wait for "Success" message');
    console.log('   5. Run this test again: npm run check-grower-setup');
  } else {
    console.log('✅ Migration is complete!');
    console.log('');
    if (!mods || mods.length === 0) {
      console.log('🔧 NEXT STEP: Set up your admin profile');
      console.log('   1. Copy your user ID from above');
      console.log('   2. Open docs/SETUP_ADMIN_PROFILES.sql');
      console.log('   3. Replace YOUR_USER_ID_HERE with your actual ID');
      console.log('   4. Run in Supabase SQL Editor');
    } else {
      console.log('🎉 Everything is set up!');
      console.log('   You can now use the Grower Directory and Messaging features');
    }
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkDatabase().catch(console.error);

