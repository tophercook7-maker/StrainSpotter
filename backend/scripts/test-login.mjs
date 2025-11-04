#!/usr/bin/env node

/**
 * Test Login Script
 * 
 * This script tests if the admin account can log in successfully
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../env/.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'strainspotter25@gmail.com';
const TEST_PASSWORD = 'KING123';

async function testLogin() {
  console.log('🧪 Testing login...');
  console.log('📧 Email:', TEST_EMAIL);
  console.log('🔑 Password:', TEST_PASSWORD);
  console.log('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('');
      console.error('Error details:', error);
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log('');
    console.log('User details:');
    console.log('  ID:', data.user.id);
    console.log('  Email:', data.user.email);
    console.log('  Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('  Created:', new Date(data.user.created_at).toLocaleString());
    console.log('');
    console.log('Session:');
    console.log('  Access token:', data.session.access_token.substring(0, 20) + '...');
    console.log('  Expires:', new Date(data.session.expires_at * 1000).toLocaleString());
    console.log('');
    console.log('🎉 You can now log in to the app with these credentials!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testLogin();

