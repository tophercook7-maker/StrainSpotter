#!/usr/bin/env node

/**
 * Reset Admin Password Script
 * 
 * This script resets the password for the admin account (strainspotter25@gmail.com)
 * to KING123
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from ../../env/.env.local
dotenv.config({ path: join(__dirname, '../../env/.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env/.env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAIL = 'strainspotter25@gmail.com';
const NEW_PASSWORD = 'KING123';

async function resetPassword() {
  console.log('🔐 Resetting password for:', ADMIN_EMAIL);
  console.log('🔑 New password:', NEW_PASSWORD);
  console.log('');

  try {
    // First, check if user exists
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);

    if (!adminUser) {
      console.log('⚠️  User not found. Creating new account...');
      
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
          username: 'admin',
          display_name: 'Admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        process.exit(1);
      }

      console.log('✅ User created successfully!');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('🔑 Password:', NEW_PASSWORD);
      console.log('🆔 User ID:', newUser.user.id);
      
      // Create profile (profiles table uses 'id' not 'user_id')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          username: 'admin',
          display_name: 'Admin',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin&backgroundColor=7CB342',
          bio: 'StrainSpotter Admin',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('⚠️  Warning: Could not create profile:', profileError.message);
        console.warn('   This is OK - profile might be created automatically');
      } else {
        console.log('✅ Profile created successfully!');
      }

    } else {
      console.log('✅ User found:', adminUser.email);
      console.log('🆔 User ID:', adminUser.id);
      console.log('');
      console.log('🔄 Updating password...');

      // Update password
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { password: NEW_PASSWORD }
      );

      if (updateError) {
        console.error('❌ Error updating password:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Password updated successfully!');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('🔑 New Password:', NEW_PASSWORD);
    }

    console.log('');
    console.log('🎉 Done! You can now log in with:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', NEW_PASSWORD);
    console.log('');
    console.log('🌐 Go to: http://localhost:5176');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

resetPassword();

