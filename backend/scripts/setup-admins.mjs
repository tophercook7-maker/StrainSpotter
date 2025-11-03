#!/usr/bin/env node

/**
 * Setup admin users: Topher and Andrew
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

async function setupAdmins() {
  console.log('🔍 Finding users and setting up admins...\n');
  
  // Get all profiles with auth users
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('❌ Error fetching profiles:', error.message);
    return;
  }
  
  console.log('📋 All Users:\n');
  for (const p of profiles) {
    // Get email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(p.id);
    const email = authUser?.user?.email || 'N/A';
    
    console.log(`ID: ${p.id}`);
    console.log(`  Email: ${email}`);
    console.log(`  Display Name: ${p.display_name || 'N/A'}`);
    console.log(`  Scan Credits: ${p.scan_credits || 0}`);
    console.log(`  Is Grower: ${p.is_grower || false}`);
    console.log('');
  }
  
  // Find Topher
  console.log('🔍 Looking for Topher (topher.cook7@gmail.com)...');
  let topherUser = null;
  for (const p of profiles) {
    const { data: authUser } = await supabase.auth.admin.getUserById(p.id);
    if (authUser?.user?.email === 'topher.cook7@gmail.com') {
      topherUser = { ...p, email: authUser.user.email };
      break;
    }
  }
  
  if (topherUser) {
    console.log('✅ Found Topher:', topherUser.id);
  } else {
    console.log('❌ Topher not found!');
  }
  
  // Find Andrew
  console.log('🔍 Looking for Andrew Beck...');
  let andrewUser = null;
  for (const p of profiles) {
    const { data: authUser } = await supabase.auth.admin.getUserById(p.id);
    const email = authUser?.user?.email || '';
    if (email.toLowerCase().includes('andrew') || email.toLowerCase().includes('beck')) {
      andrewUser = { ...p, email: authUser.user.email };
      break;
    }
  }
  
  if (andrewUser) {
    console.log('✅ Found Andrew:', andrewUser.id);
  } else {
    console.log('⚠️  Andrew not found - will need to create account');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 SQL TO RUN IN SUPABASE SQL EDITOR:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (topherUser) {
    console.log(`-- Setup Topher as Admin/Owner/Moderator`);
    console.log(`UPDATE profiles SET`);
    console.log(`  display_name = 'Topher Cook',`);
    console.log(`  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=topher&backgroundColor=10b981',`);
    console.log(`  bio = 'Founder & Head Cultivator of StrainSpotter 🌿',`);
    console.log(`  is_grower = true,`);
    console.log(`  grower_license_status = 'licensed',`);
    console.log(`  grower_experience_years = 15,`);
    console.log(`  grower_bio = 'Founder of StrainSpotter with 15+ years of cultivation experience.',`);
    console.log(`  grower_specialties = ARRAY['indoor', 'outdoor', 'organic', 'hydroponics'],`);
    console.log(`  grower_city = 'Denver',`);
    console.log(`  grower_state = 'Colorado',`);
    console.log(`  grower_farm_name = 'StrainSpotter HQ',`);
    console.log(`  grower_listed_in_directory = true,`);
    console.log(`  grower_directory_consent_date = now(),`);
    console.log(`  grower_accepts_messages = true,`);
    console.log(`  grower_image_approved = true,`);
    console.log(`  scan_credits = 999`);
    console.log(`WHERE id = '${topherUser.id}';\n`);
    
    console.log(`-- Make Topher a moderator`);
    console.log(`INSERT INTO moderators (user_id, assigned_by, permissions, is_active)`);
    console.log(`VALUES (`);
    console.log(`  '${topherUser.id}',`);
    console.log(`  '${topherUser.id}',`);
    console.log(`  ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],`);
    console.log(`  true`);
    console.log(`)`);
    console.log(`ON CONFLICT (user_id) DO UPDATE SET`);
    console.log(`  permissions = ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],`);
    console.log(`  is_active = true;\n`);
  }
  
  if (andrewUser) {
    console.log(`-- Setup Andrew Beck as Admin/Owner/Moderator`);
    console.log(`UPDATE profiles SET`);
    console.log(`  display_name = 'Andrew Beck',`);
    console.log(`  avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=andrew&backgroundColor=3b82f6',`);
    console.log(`  bio = 'Co-Founder of StrainSpotter 🌿',`);
    console.log(`  is_grower = true,`);
    console.log(`  grower_license_status = 'licensed',`);
    console.log(`  grower_experience_years = 12,`);
    console.log(`  grower_bio = 'Co-Founder of StrainSpotter with 12+ years of cultivation experience.',`);
    console.log(`  grower_specialties = ARRAY['indoor', 'organic', 'breeding'],`);
    console.log(`  grower_city = 'Denver',`);
    console.log(`  grower_state = 'Colorado',`);
    console.log(`  grower_farm_name = 'StrainSpotter HQ',`);
    console.log(`  grower_listed_in_directory = true,`);
    console.log(`  grower_directory_consent_date = now(),`);
    console.log(`  grower_accepts_messages = true,`);
    console.log(`  grower_image_approved = true,`);
    console.log(`  scan_credits = 999`);
    console.log(`WHERE id = '${andrewUser.id}';\n`);
    
    console.log(`-- Make Andrew a moderator`);
    console.log(`INSERT INTO moderators (user_id, assigned_by, permissions, is_active)`);
    console.log(`VALUES (`);
    console.log(`  '${andrewUser.id}',`);
    console.log(`  '${topherUser?.id || andrewUser.id}',`);
    console.log(`  ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],`);
    console.log(`  true`);
    console.log(`)`);
    console.log(`ON CONFLICT (user_id) DO UPDATE SET`);
    console.log(`  permissions = ARRAY['moderate_messages', 'moderate_images', 'warn_users', 'suspend_users', 'ban_users'],`);
    console.log(`  is_active = true;\n`);
  }
  
  console.log(`-- Verify`);
  console.log(`SELECT id, display_name, scan_credits, is_grower, grower_farm_name FROM profiles`);
  console.log(`WHERE id IN ('${topherUser?.id || ''}', '${andrewUser?.id || ''}');\n`);
  
  console.log(`SELECT user_id, permissions, is_active FROM moderators`);
  console.log(`WHERE user_id IN ('${topherUser?.id || ''}', '${andrewUser?.id || ''}');\n`);
}

setupAdmins().catch(console.error);
