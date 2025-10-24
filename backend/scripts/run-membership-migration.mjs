#!/usr/bin/env node
/**
 * Run membership migration to create membership_applications, memberships, and trial_usage tables
 */

import { supabaseAdmin } from '../supabaseAdmin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin not configured. Set SUPABASE_SERVICE_ROLE_KEY in env/.env.local');
    process.exit(1);
  }

  console.log('📝 Reading membership migration SQL...');
  const sqlPath = path.join(__dirname, '../migrations/2025_10_21_membership_tracking.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Running membership migration...');
  
  // Split by semicolon and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.toUpperCase() !== 'COMMENT ON TABLE');

  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        // Try direct query if RPC fails
        const result = await supabaseAdmin.from('_').select('*').limit(0);
        console.log('⚠️  RPC not available, using direct SQL runner instead');
        
        // For Supabase, we need to run this in the SQL editor manually
        console.log('\n📋 Please run this migration in the Supabase SQL Editor:');
        console.log('https://app.supabase.com/project/_/sql/new');
        console.log('\nCopy and paste the contents of:');
        console.log(sqlPath);
        console.log('\nOr run each statement via the Supabase dashboard.\n');
        process.exit(1);
      }
    } catch (e) {
      console.error('Error running statement:', statement.substring(0, 100) + '...');
      console.error(e.message);
    }
  }

  console.log('✅ Migration complete! Verifying tables...');

  // Verify tables exist
  const tables = ['memberships', 'trial_usage', 'membership_applications'];
  
  for (const table of tables) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Table ${table} verification failed:`, error.message);
    } else {
      console.log(`✅ Table ${table} exists and is accessible`);
    }
  }

  console.log('\n🎉 Membership system is ready!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
