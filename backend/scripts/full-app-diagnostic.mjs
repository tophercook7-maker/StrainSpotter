#!/usr/bin/env node

/**
 * Full App Diagnostic - Check everything
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
const API_BASE = process.env.VITE_API_BASE || 'http://localhost:5181';

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DATABASE CHECKS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const tables = [
    'profiles',
    'scans',
    'scan_credit_transactions',
    'seed_vendors',
    'vendor_strains',
    'dispensaries',
    'dispensary_strains',
    'conversations',
    'messages',
    'moderators'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: OK`);
    }
  }
}

async function checkBackendAPI() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 BACKEND API CHECKS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const endpoints = [
    '/api/strains',
    '/api/scans',
    '/api/seeds-live',
    '/api/dispensaries-live?lat=37.7749&lng=-122.4194&radius=10',
    '/api/grower-profiles',
    '/api/messages/conversations'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${response.status}`);
      } else {
        console.log(`⚠️  ${endpoint}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

async function checkAdminUsers() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 ADMIN USERS CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const topherID = '2d3d5906-a5cc-4bca-a6de-c98586728dfa';
  const andrewID = '237fc1d6-3c5e-4a50-b01a-f71fcd825768';
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', [topherID, andrewID]);
  
  const { data: moderators } = await supabase
    .from('moderators')
    .select('*')
    .in('user_id', [topherID, andrewID]);
  
  console.log('Topher (topher.cook7@gmail.com):');
  const topher = profiles?.find(p => p.id === topherID);
  if (topher) {
    console.log(`  ✅ Profile exists`);
    console.log(`  Display Name: ${topher.display_name}`);
    console.log(`  Scan Credits: ${topher.scan_credits}`);
    console.log(`  Is Grower: ${topher.is_grower}`);
    console.log(`  Farm Name: ${topher.grower_farm_name || 'N/A'}`);
  } else {
    console.log(`  ❌ Profile NOT found`);
  }
  
  const topherMod = moderators?.find(m => m.user_id === topherID);
  if (topherMod) {
    console.log(`  ✅ Moderator: ${topherMod.is_active ? 'Active' : 'Inactive'}`);
  } else {
    console.log(`  ❌ NOT a moderator`);
  }
  
  console.log('\nAndrew (andrewbeck209@gmail.com):');
  const andrew = profiles?.find(p => p.id === andrewID);
  if (andrew) {
    console.log(`  ✅ Profile exists`);
    console.log(`  Display Name: ${andrew.display_name}`);
    console.log(`  Scan Credits: ${andrew.scan_credits}`);
    console.log(`  Is Grower: ${andrew.is_grower}`);
    console.log(`  Farm Name: ${andrew.grower_farm_name || 'N/A'}`);
  } else {
    console.log(`  ❌ Profile NOT found`);
  }
  
  const andrewMod = moderators?.find(m => m.user_id === andrewID);
  if (andrewMod) {
    console.log(`  ✅ Moderator: ${andrewMod.is_active ? 'Active' : 'Inactive'}`);
  } else {
    console.log(`  ❌ NOT a moderator`);
  }
}

async function checkSeedVendors() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SEED VENDORS CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: vendors, error } = await supabase
    .from('seed_vendors')
    .select('*')
    .limit(5);
  
  if (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('⚠️  You need to run: backend/migrations/2025_add_vendors_dispensaries.sql');
    console.log('⚠️  Then run: backend/migrations/2025_seed_vendors_dispensaries_data.sql');
  } else if (!vendors || vendors.length === 0) {
    console.log('⚠️  No seed vendors found in database');
    console.log('⚠️  Run: backend/migrations/2025_seed_vendors_dispensaries_data.sql');
  } else {
    console.log(`✅ Found ${vendors.length} seed vendors:`);
    vendors.forEach(v => {
      console.log(`  - ${v.name} (${v.country})`);
    });
  }
}

async function checkDispensaries() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DISPENSARIES CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: dispensaries, error } = await supabase
    .from('dispensaries')
    .select('*')
    .limit(5);
  
  if (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('⚠️  You need to run: backend/migrations/2025_add_vendors_dispensaries.sql');
    console.log('⚠️  Then run: backend/migrations/2025_seed_vendors_dispensaries_data.sql');
  } else if (!dispensaries || dispensaries.length === 0) {
    console.log('⚠️  No dispensaries found in database');
    console.log('⚠️  Run: backend/migrations/2025_seed_vendors_dispensaries_data.sql');
  } else {
    console.log(`✅ Found ${dispensaries.length} dispensaries:`);
    dispensaries.forEach(d => {
      console.log(`  - ${d.name} (${d.city}, ${d.state})`);
    });
  }
}

async function checkScans() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SCANS CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const topherID = '2d3d5906-a5cc-4bca-a6de-c98586728dfa';
  
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', topherID)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (scans && scans.length > 0) {
    console.log(`✅ Topher has ${scans.length} recent scans:`);
    scans.forEach(s => {
      console.log(`  - ${s.id} | Status: ${s.status} | ${s.created_at}`);
    });
  } else {
    console.log('⚠️  Topher has no scans yet');
  }
}

async function runDiagnostic() {
  console.log('\n🌿 STRAINSPOTTER FULL APP DIAGNOSTIC 🌿\n');
  
  await checkDatabase();
  await checkBackendAPI();
  await checkAdminUsers();
  await checkSeedVendors();
  await checkDispensaries();
  await checkScans();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 SUMMARY & NEXT STEPS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1. Run backend/migrations/SETUP_ADMINS.sql in Supabase SQL Editor');
  console.log('2. Check if seed vendors/dispensaries tables need data');
  console.log('3. Test scanning with Topher account');
  console.log('4. Check Vercel deployment environment variables');
  console.log('');
}

runDiagnostic().catch(console.error);

