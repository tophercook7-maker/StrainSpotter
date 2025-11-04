#!/usr/bin/env node

/**
 * StrainSpotter Feedback Viewer
 * 
 * View all feedback submissions from the command line
 * 
 * Usage:
 *   node backend/scripts/view-feedback.mjs
 *   node backend/scripts/view-feedback.mjs --recent (last 24 hours)
 *   node backend/scripts/view-feedback.mjs --count (count only)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rdqpxixsbqcsyfewcmbz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.error('Please add it to backend/.env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getFeedbackGroupId() {
  const { data, error } = await supabase
    .from('groups')
    .select('id')
    .eq('name', 'Feedback')
    .single();

  if (error) {
    console.error('❌ Error finding Feedback group:', error.message);
    return null;
  }

  return data?.id;
}

async function viewAllFeedback() {
  console.log('\n📬 StrainSpotter Feedback Viewer\n');
  console.log('═'.repeat(80));

  const groupId = await getFeedbackGroupId();
  if (!groupId) {
    console.error('❌ Feedback group not found. Please run the database migration first.');
    return;
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (
        email,
        username
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching feedback:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('\n📭 No feedback submissions yet.\n');
    return;
  }

  console.log(`\n✅ Found ${messages.length} feedback submission(s)\n`);
  console.log('═'.repeat(80));

  messages.forEach((msg, index) => {
    const submittedBy = msg.user_id 
      ? (msg.profiles?.username || msg.profiles?.email || 'Unknown User')
      : 'Anonymous';
    
    const date = new Date(msg.created_at).toLocaleString();
    
    console.log(`\n[${index + 1}] ${date}`);
    console.log(`👤 Submitted by: ${submittedBy}`);
    console.log(`💬 Message:`);
    console.log(`   ${msg.content}`);
    console.log('─'.repeat(80));
  });

  console.log('\n');
}

async function viewRecentFeedback() {
  console.log('\n📬 Recent Feedback (Last 24 Hours)\n');
  console.log('═'.repeat(80));

  const groupId = await getFeedbackGroupId();
  if (!groupId) {
    console.error('❌ Feedback group not found.');
    return;
  }

  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (
        email,
        username
      )
    `)
    .eq('group_id', groupId)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching feedback:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('\n📭 No feedback in the last 24 hours.\n');
    return;
  }

  console.log(`\n✅ Found ${messages.length} recent submission(s)\n`);
  console.log('═'.repeat(80));

  messages.forEach((msg, index) => {
    const submittedBy = msg.user_id 
      ? (msg.profiles?.username || msg.profiles?.email || 'Unknown User')
      : 'Anonymous';
    
    const date = new Date(msg.created_at).toLocaleString();
    
    console.log(`\n[${index + 1}] ${date}`);
    console.log(`👤 Submitted by: ${submittedBy}`);
    console.log(`💬 Message:`);
    console.log(`   ${msg.content}`);
    console.log('─'.repeat(80));
  });

  console.log('\n');
}

async function countFeedback() {
  console.log('\n📊 Feedback Statistics\n');
  console.log('═'.repeat(80));

  const groupId = await getFeedbackGroupId();
  if (!groupId) {
    console.error('❌ Feedback group not found.');
    return;
  }

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (error) {
    console.error('❌ Error counting feedback:', error.message);
    return;
  }

  console.log(`\n✅ Total feedback submissions: ${count}\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📬 StrainSpotter Feedback Viewer

Usage:
  node backend/scripts/view-feedback.mjs              View all feedback
  node backend/scripts/view-feedback.mjs --recent     View last 24 hours
  node backend/scripts/view-feedback.mjs --count      Count total feedback
  node backend/scripts/view-feedback.mjs --help       Show this help

Examples:
  node backend/scripts/view-feedback.mjs
  node backend/scripts/view-feedback.mjs --recent
  node backend/scripts/view-feedback.mjs --count
  `);
  process.exit(0);
}

if (args.includes('--recent')) {
  viewRecentFeedback();
} else if (args.includes('--count')) {
  countFeedback();
} else {
  viewAllFeedback();
}

