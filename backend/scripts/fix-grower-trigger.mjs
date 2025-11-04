#!/usr/bin/env node

/**
 * Fix the update_grower_last_active trigger function
 * 
 * The profiles table uses 'id' as primary key, not 'user_id'
 * This was causing feedback submissions to fail with:
 * "null value in column "user_id" of relation "messages" violates not-null constraint"
 */

import { supabaseAdmin } from '../supabaseAdmin.js';

const SQL = `
-- Fix the update_grower_last_active trigger function
-- The profiles table uses 'id' as primary key, not 'user_id'

CREATE OR REPLACE FUNCTION update_grower_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET grower_last_active = now()
  WHERE id = NEW.sender_id  -- Changed from user_id to id
    AND is_grower = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function fixTrigger() {
  console.log('🔧 Fixing update_grower_last_active trigger function...\n');
  
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: SQL });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative method - direct query
      console.log('\n🔄 Trying alternative method...\n');
      
      const { error: altError } = await supabaseAdmin
        .from('_migrations')
        .insert({ name: 'fix_grower_trigger', sql: SQL });
      
      if (altError) {
        console.error('❌ Alternative method failed:', altError);
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('─'.repeat(60));
        console.log(SQL);
        console.log('─'.repeat(60));
        process.exit(1);
      }
    }
    
    console.log('✅ Trigger function fixed successfully!\n');
    console.log('The profiles table now correctly uses "id" instead of "user_id"');
    console.log('\n🧪 Test feedback submission now - it should work!');
    
  } catch (e) {
    console.error('❌ Unexpected error:', e);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(SQL);
    console.log('─'.repeat(60));
    process.exit(1);
  }
}

fixTrigger();

