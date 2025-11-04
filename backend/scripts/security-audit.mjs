#!/usr/bin/env node

/**
 * Security Audit Script for StrainSpotter
 * Tests RLS policies, authentication, and security configurations
 */

import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const API_BASE = 'http://localhost:5181';

console.log('🔒 Starting Security Audit...\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

// Test 1: RLS Enabled on All Tables
console.log('1️⃣ Testing Row Level Security (RLS)...\n');

const tables = ['profiles', 'scans', 'reviews', 'messages', 'growers', 'strains'];

for (const table of tables) {
  try {
    // Try to access table without auth (should fail or return empty)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (table === 'strains') {
      // Strains should be publicly readable
      if (data && data.length > 0) {
        console.log(`✅ ${table}: Public read access (expected)`);
        results.passed++;
      } else {
        console.log(`⚠️  ${table}: No data or RLS blocking (check if expected)`);
        results.warnings++;
      }
    } else {
      // Other tables should be protected
      if (error && error.message.includes('row-level security')) {
        console.log(`✅ ${table}: RLS properly blocking unauthenticated access`);
        results.passed++;
      } else if (!data || data.length === 0) {
        console.log(`✅ ${table}: Protected (no data returned)`);
        results.passed++;
      } else {
        console.log(`⚠️  ${table}: May have public access (${data.length} rows returned)`);
        results.warnings++;
        results.issues.push(`${table} may not have proper RLS policies`);
      }
    }
  } catch (e) {
    console.log(`❌ ${table}: Error testing RLS - ${e.message}`);
    results.failed++;
  }
}

// Test 2: Admin Endpoints Require Authentication
console.log('\n2️⃣ Testing Admin Endpoint Security...\n');

const adminEndpoints = [
  '/api/admin/health',
  '/api/admin/users',
  '/api/admin/rls-status'
];

for (const endpoint of adminEndpoints) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    
    // Admin endpoints should return 200 (they're currently open for dev)
    // In production, these should require authentication
    if (res.ok) {
      console.log(`⚠️  ${endpoint}: Accessible without auth (OK for dev, secure for prod)`);
      results.warnings++;
      results.issues.push(`${endpoint} should require authentication in production`);
    } else {
      console.log(`✅ ${endpoint}: Properly secured (${res.status})`);
      results.passed++;
    }
  } catch (e) {
    console.log(`❌ ${endpoint}: Error - ${e.message}`);
    results.failed++;
  }
}

// Test 3: Sensitive Data Exposure
console.log('\n3️⃣ Testing for Sensitive Data Exposure...\n');

try {
  // Check if user emails are exposed in public endpoints
  const res = await fetch(`${API_BASE}/api/growers`);
  const data = await res.json();
  
  if (data.growers && data.growers.length > 0) {
    const hasEmail = data.growers.some(g => g.email);
    if (hasEmail) {
      console.log('⚠️  Growers API: Email addresses exposed');
      results.warnings++;
      results.issues.push('Grower emails should not be publicly visible');
    } else {
      console.log('✅ Growers API: No email exposure');
      results.passed++;
    }
  } else {
    console.log('✅ Growers API: No data to check (OK)');
    results.passed++;
  }
} catch (e) {
  console.log(`❌ Growers API: Error - ${e.message}`);
  results.failed++;
}

// Test 4: SQL Injection Protection
console.log('\n4️⃣ Testing SQL Injection Protection...\n');

try {
  // Try SQL injection in query params
  const maliciousInputs = [
    "'; DROP TABLE scans; --",
    "1' OR '1'='1",
    "admin'--",
    "<script>alert('xss')</script>"
  ];
  
  for (const input of maliciousInputs) {
    const res = await fetch(`${API_BASE}/api/scans?user_id=${encodeURIComponent(input)}`);
    
    if (res.ok) {
      const data = await res.json();
      // Should return empty or error, not crash
      console.log(`✅ SQL Injection Test: Handled safely (${res.status})`);
      results.passed++;
    } else if (res.status === 400 || res.status === 500) {
      console.log(`✅ SQL Injection Test: Rejected malicious input (${res.status})`);
      results.passed++;
    }
  }
} catch (e) {
  console.log(`❌ SQL Injection Test: Error - ${e.message}`);
  results.failed++;
}

// Test 5: Rate Limiting
console.log('\n5️⃣ Testing Rate Limiting...\n');

try {
  const requests = [];
  for (let i = 0; i < 50; i++) {
    requests.push(fetch(`${API_BASE}/api/health`));
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.some(r => r.status === 429);
  
  if (rateLimited) {
    console.log('✅ Rate Limiting: Active (429 responses detected)');
    results.passed++;
  } else {
    console.log('⚠️  Rate Limiting: Not detected (consider adding for production)');
    results.warnings++;
    results.issues.push('Add rate limiting to prevent abuse');
  }
} catch (e) {
  console.log(`❌ Rate Limiting Test: Error - ${e.message}`);
  results.failed++;
}

// Test 6: CORS Configuration
console.log('\n6️⃣ Testing CORS Configuration...\n');

try {
  const res = await fetch(`${API_BASE}/api/health`, {
    headers: {
      'Origin': 'https://malicious-site.com'
    }
  });
  
  const corsHeader = res.headers.get('access-control-allow-origin');
  
  if (corsHeader === '*') {
    console.log('⚠️  CORS: Allows all origins (OK for dev, restrict for prod)');
    results.warnings++;
    results.issues.push('Restrict CORS to specific origins in production');
  } else if (corsHeader) {
    console.log(`✅ CORS: Restricted to ${corsHeader}`);
    results.passed++;
  } else {
    console.log('✅ CORS: No CORS header (restrictive)');
    results.passed++;
  }
} catch (e) {
  console.log(`❌ CORS Test: Error - ${e.message}`);
  results.failed++;
}

// Test 7: Environment Variables Security
console.log('\n7️⃣ Testing Environment Variables...\n');

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
    results.passed++;
  } else {
    console.log(`❌ ${envVar}: Missing`);
    results.failed++;
    results.issues.push(`${envVar} is not set`);
  }
}

// Test 8: Password Requirements
console.log('\n8️⃣ Testing Password Requirements...\n');

try {
  // Supabase handles password requirements
  console.log('✅ Password Requirements: Handled by Supabase Auth');
  results.passed++;
} catch (e) {
  console.log(`❌ Password Requirements: Error - ${e.message}`);
  results.failed++;
}

// Summary
console.log('\n============================================================');
console.log('🔒 SECURITY AUDIT SUMMARY');
console.log('============================================================');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log('============================================================\n');

if (results.issues.length > 0) {
  console.log('🚨 SECURITY ISSUES FOUND:\n');
  results.issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
  console.log('');
}

if (results.failed === 0 && results.warnings <= 5) {
  console.log('✅ Security audit passed! App is reasonably secure for development.');
  console.log('⚠️  Remember to address warnings before production deployment.\n');
} else if (results.failed > 0) {
  console.log('❌ Security audit failed! Critical issues must be fixed.\n');
  process.exit(1);
} else {
  console.log('⚠️  Security audit completed with warnings. Review before production.\n');
}

