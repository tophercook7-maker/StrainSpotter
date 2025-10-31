/**
 * Script to reset admin password
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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const adminEmail = 'topher.cook7@gmail.com';
  const newPassword = 'KING123';

  console.log('🔧 Resetting password for:', adminEmail);

  try {
    // Get user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const user = existingUsers?.users?.find(u => u.email === adminEmail);

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('✓ Found user:', user.id);

    // Update password and confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true,
        ban_duration: 'none',
        user_metadata: {
          username: 'Admin',
          membership: 'club',
          membership_started: new Date().toISOString(),
          payment_status: 'active',
          subscription_tier: 'premium',
          role: 'admin'
        }
      }
    );

    if (error) throw error;

    // Also verify the email is confirmed
    console.log('✓ Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email:', adminEmail);
    console.log('  Password:', newPassword);
    console.log('');

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

resetPassword();

