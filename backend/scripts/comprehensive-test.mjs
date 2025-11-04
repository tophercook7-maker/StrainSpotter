#!/usr/bin/env node
/**
 * Comprehensive StrainSpotter App Testing Script
 * Tests all features, API endpoints, and database operations
 */

import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const API_BASE = process.env.API_BASE || 'http://localhost:5181';
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: [],
  startTime: Date.now()
};

// Helper functions
function logTest(name, passed, details = '') {
  const result = { name, passed, details, timestamp: new Date().toISOString() };
  if (passed) {
    TEST_RESULTS.passed.push(result);
    console.log(`✅ ${name}`);
  } else {
    TEST_RESULTS.failed.push(result);
    console.log(`❌ ${name}: ${details}`);
  }
  if (details && passed) {
    console.log(`   ${details}`);
  }
}

function logWarning(name, details) {
  TEST_RESULTS.warnings.push({ name, details, timestamp: new Date().toISOString() });
  console.log(`⚠️  ${name}: ${details}`);
}

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json().catch(() => null);
    
    return {
      ok: response.status === expectedStatus,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

// ============================================
// 1. AUTHENTICATION & USER MANAGEMENT TESTS
// ============================================
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication & User Management...\n');
  
  // Test health endpoint
  const health = await testEndpoint('GET', '/api/health');
  logTest('Health Check', health.ok, `Status: ${health.status}`);
  
  // Test admin health
  const adminHealth = await testEndpoint('GET', '/api/admin/health');
  logTest('Admin Health Check', adminHealth.ok);
  
  // Test RLS status
  const rlsStatus = await testEndpoint('GET', '/api/admin/rls-status');
  logTest('RLS Status Check', rlsStatus.ok, `Service Role: ${rlsStatus.data?.hasServiceRole}`);
  
  // Test user creation endpoint
  const userEnsure = await testEndpoint('POST', '/api/users/ensure', {
    user_id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com'
  }, 400); // Should fail without proper auth
  logTest('User Ensure Endpoint Exists', userEnsure.status === 400 || userEnsure.status === 200);
  
  // Test profile generator preview
  const profilePreview = await testEndpoint('GET', '/api/profile-generator/preview?email=test@example.com');
  logTest('Profile Generator Preview', profilePreview.ok, `Generated username: ${profilePreview.data?.username}`);
}

// ============================================
// 2. SCAN SYSTEM TESTS
// ============================================
async function testScanSystem() {
  console.log('\n📸 Testing Scan System...\n');
  
  // Test scan diagnostic
  const scanDiag = await testEndpoint('GET', '/api/diagnostic/scan');
  logTest('Scan Diagnostic Endpoint', scanDiag.ok);
  
  if (scanDiag.data) {
    logTest('Google Vision API', scanDiag.data.steps?.process?.passed, 
      `Duration: ${scanDiag.data.steps?.process?.duration}ms`);
    logTest('Strain Matching', scanDiag.data.steps?.match?.passed,
      `Matched: ${scanDiag.data.steps?.match?.topMatch?.name || 'N/A'}`);
  }
  
  // Test scans table access
  try {
    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('*')
      .limit(5);
    
    logTest('Scans Table Access', !error, error ? error.message : `Found ${data?.length || 0} scans`);
  } catch (e) {
    logTest('Scans Table Access', false, e.message);
  }
  
  // Test scan credits system
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('scan_credits, scan_credits_monthly_bundle')
      .limit(1)
      .single();
    
    logTest('Scan Credits System', !error, `Credits: ${data?.scan_credits || 0}`);
  } catch (e) {
    logTest('Scan Credits System', false, e.message);
  }
}

// ============================================
// 3. REVIEW SYSTEM TESTS
// ============================================
async function testReviewSystem() {
  console.log('\n⭐ Testing Review System...\n');
  
  // Test reviews table
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .limit(5);
    
    logTest('Reviews Table Access', !error, `Found ${data?.length || 0} reviews`);
  } catch (e) {
    logTest('Reviews Table Access', false, e.message);
  }
  
  // Test reviews API endpoint
  const reviews = await testEndpoint('GET', '/api/reviews');
  logTest('Reviews API Endpoint', reviews.ok, `Status: ${reviews.status}`);
}

// ============================================
// 4. GROWER DIRECTORY TESTS
// ============================================
async function testGrowerDirectory() {
  console.log('\n🌱 Testing Grower Directory...\n');
  
  // Test growers endpoint
  const growers = await testEndpoint('GET', '/api/growers');
  logTest('Growers API Endpoint', growers.ok, `Found ${growers.data?.length || 0} growers`);
  
  // Test growers table
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('is_grower', true)
      .limit(5);
    
    logTest('Growers Table Query', !error, `Found ${data?.length || 0} grower profiles`);
  } catch (e) {
    logTest('Growers Table Query', false, e.message);
  }
  
  // Test messaging system
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .limit(5);
    
    logTest('Messages Table Access', !error, `Found ${data?.length || 0} messages`);
  } catch (e) {
    logTest('Messages Table Access', false, e.message);
  }
}

// ============================================
// 5. FEEDBACK SYSTEM TESTS
// ============================================
async function testFeedbackSystem() {
  console.log('\n💬 Testing Feedback System...\n');
  
  // Test feedback messages endpoint
  const feedback = await testEndpoint('GET', '/api/feedback/messages');
  logTest('Feedback Messages Endpoint', feedback.ok, `Found ${feedback.data?.length || 0} feedback items`);
  
  // Check if feedback has proper user data
  if (feedback.data && feedback.data.length > 0) {
    const firstFeedback = feedback.data[0];
    const hasUserData = firstFeedback.sender && (firstFeedback.sender.username || firstFeedback.sender.display_name);
    logTest('Feedback User Data', hasUserData, 
      `Username: ${firstFeedback.sender?.username || 'N/A'}, Display: ${firstFeedback.sender?.display_name || 'N/A'}`);
  }
}

// ============================================
// 6. ADMIN FEATURES TESTS
// ============================================
async function testAdminFeatures() {
  console.log('\n👑 Testing Admin Features...\n');
  
  // Test admin users
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    logTest('Admin User List', !error, `Total users: ${data?.users?.length || 0}`);
    
    // Check for admin accounts
    const adminEmails = ['strainspotter25@gmail.com', 'admin@strainspotter.com'];
    const admins = data?.users?.filter(u => adminEmails.includes(u.email)) || [];
    logTest('Admin Accounts Exist', admins.length > 0, `Found ${admins.length} admin accounts`);
  } catch (e) {
    logTest('Admin User List', false, e.message);
  }
  
  // Test scan credits for admins
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('scan_credits, display_name')
      .in('id', ['6401f241-238b-4ebd-9a34-bb4e5b7bdfa8']) // strainspotter25@gmail.com
      .single();
    
    const hasCorrectCredits = data?.scan_credits === 999;
    logTest('Admin Scan Credits', hasCorrectCredits, 
      `Credits: ${data?.scan_credits || 0} (Expected: 999)`);
    
    if (!hasCorrectCredits && data) {
      logWarning('Admin Credits', `Admin has ${data.scan_credits} credits, should be 999`);
    }
  } catch (e) {
    logTest('Admin Scan Credits', false, e.message);
  }
}

// ============================================
// 7. DATABASE & API LOAD TESTS
// ============================================
async function testDatabaseLoad() {
  console.log('\n🔥 Testing Database & API Load...\n');
  
  const startTime = Date.now();
  const promises = [];
  
  // Concurrent requests test
  for (let i = 0; i < 10; i++) {
    promises.push(testEndpoint('GET', '/api/health'));
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  const allPassed = results.every(r => r.ok);
  
  logTest('Concurrent Requests (10x)', allPassed, `Duration: ${duration}ms, Avg: ${(duration/10).toFixed(2)}ms`);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive StrainSpotter Testing...\n');
  console.log(`API Base: ${API_BASE}\n`);
  
  await testAuthentication();
  await testScanSystem();
  await testReviewSystem();
  await testGrowerDirectory();
  await testFeedbackSystem();
  await testAdminFeatures();
  await testDatabaseLoad();
  
  // Print summary
  const duration = Date.now() - TEST_RESULTS.startTime;
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${TEST_RESULTS.passed.length}`);
  console.log(`❌ Failed: ${TEST_RESULTS.failed.length}`);
  console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings.length}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log('='.repeat(60));
  
  if (TEST_RESULTS.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.failed.forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }
  
  if (TEST_RESULTS.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    TEST_RESULTS.warnings.forEach(w => {
      console.log(`  - ${w.name}: ${w.details}`);
    });
  }
  
  process.exit(TEST_RESULTS.failed.length > 0 ? 1 : 0);
}

runAllTests().catch(console.error);

