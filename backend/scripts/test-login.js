/**
 * Test login with admin credentials
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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use ANON key like the frontend does
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  const email = 'topher.cook7@gmail.com';
  const password = 'KING123';

  console.log('🔐 Testing login with:');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Login failed:', error);
      console.error('   Status:', error.status);
      console.error('   Message:', error.message);
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log('');
    console.log('User:', data.user.email);
    console.log('User ID:', data.user.id);
    console.log('Membership:', data.user.user_metadata?.membership);
    console.log('Role:', data.user.user_metadata?.role);
    console.log('');
    console.log('Session:', data.session ? 'Active' : 'None');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

testLogin();

