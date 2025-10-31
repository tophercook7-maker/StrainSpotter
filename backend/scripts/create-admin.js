/**
 * Script to create admin account
 * Email: (your email)
 * Password: KING123
 * Membership: club (auto-set)
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
  console.error('❌ Missing Supabase credentials in env/.env.local');
  console.error('   Need: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAccount() {
  const adminEmail = process.argv[2];
  const adminPassword = 'KING123';
  const adminName = 'Admin';

  if (!adminEmail) {
    console.error('❌ Please provide admin email as argument');
    console.error('   Usage: node create-admin.js your-email@example.com');
    process.exit(1);
  }

  console.log('🔧 Creating admin account...');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Membership: club (auto-set)`);

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    if (existingUser) {
      console.log('⚠️  User already exists, updating membership...');
      
      // Update existing user to be admin with club membership
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            username: adminName,
            membership: 'club',
            membership_started: new Date().toISOString(),
            payment_status: 'active',
            subscription_tier: 'premium',
            role: 'admin'
          }
        }
      );

      if (error) throw error;

      console.log('✅ Admin account updated successfully!');
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Membership: club`);
      console.log(`   Role: admin`);
      
    } else {
      // Create new admin user
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          username: adminName,
          membership: 'club',
          membership_started: new Date().toISOString(),
          payment_status: 'active',
          subscription_tier: 'premium',
          role: 'admin'
        }
      });

      if (error) throw error;

      console.log('✅ Admin account created successfully!');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Membership: club`);
      console.log(`   Role: admin`);
    }

    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Failed to create admin account:', error.message);
    process.exit(1);
  }
}

createAdminAccount();

