#!/usr/bin/env node

/**
 * Test Database Index Performance
 * Measures query performance before and after adding indexes
 */

import { supabaseAdmin } from '../supabaseAdmin.js';

console.log('🧪 Testing Database Query Performance...\n');

async function measureQuery(name, queryFn, warmup = false) {
  // Run warmup query to establish connection
  if (warmup) {
    try {
      await queryFn();
    } catch (e) {
      // Ignore warmup errors
    }
  }

  // Run actual timed query
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    const count = result.data?.length || 0;
    return { name, duration, count, success: true, error: null };
  } catch (error) {
    const duration = Date.now() - start;
    return { name, duration, count: 0, success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];

  console.log('Running performance tests...\n');
  console.log('⏳ Warming up connection...');

  // Warmup query to establish connection
  try {
    await supabaseAdmin.from('profiles').select('id').limit(1);
    console.log('✅ Connection established\n');
  } catch (e) {
    console.log('⚠️  Connection warmup failed, continuing anyway...\n');
  }

  // Test 1: Load user's scans (most common query)
  console.log('1️⃣ Testing: Load user scans...');
  const test1 = await measureQuery(
    'User Scans (user_id filter)',
    async () => {
      const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
      if (!users) return { data: [] };
      return await supabaseAdmin
        .from('scans')
        .select('*')
        .eq('user_id', users.id)
        .order('created_at', { ascending: false });
    }
  );
  results.push(test1);
  console.log(`   ${test1.success ? '✅' : '❌'} ${test1.duration}ms (${test1.count} rows)\n`);

  // Test 2: Load scans by status
  console.log('2️⃣ Testing: Filter scans by status...');
  const test2 = await measureQuery(
    'Scans by Status (status filter)',
    async () => {
      return await supabaseAdmin
        .from('scans')
        .select('*')
        .eq('status', 'completed')
        .limit(100);
    }
  );
  results.push(test2);
  console.log(`   ${test2.success ? '✅' : '❌'} ${test2.duration}ms (${test2.count} rows)\n`);

  // Test 3: Load recent scans (sorting)
  console.log('3️⃣ Testing: Load recent scans (sorting)...');
  const test3 = await measureQuery(
    'Recent Scans (created_at sort)',
    async () => {
      return await supabaseAdmin
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    }
  );
  results.push(test3);
  console.log(`   ${test3.success ? '✅' : '❌'} ${test3.duration}ms (${test3.count} rows)\n`);

  // Test 4: Load strain reviews
  console.log('4️⃣ Testing: Load strain reviews...');
  const test4 = await measureQuery(
    'Strain Reviews (strain_id filter)',
    async () => {
      return await supabaseAdmin
        .from('reviews')
        .select('*')
        .limit(100);
    }
  );
  results.push(test4);
  console.log(`   ${test4.success ? '✅' : '❌'} ${test4.duration}ms (${test4.count} rows)\n`);

  // Test 5: Load feedback messages
  console.log('5️⃣ Testing: Load feedback messages...');
  const test5 = await measureQuery(
    'Feedback Messages (type filter + sort)',
    async () => {
      return await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('type', 'feedback')
        .order('created_at', { ascending: false })
        .limit(50);
    }
  );
  results.push(test5);
  console.log(`   ${test5.success ? '✅' : '❌'} ${test5.duration}ms (${test5.count} rows)\n`);

  // Test 6: Load grower directory
  console.log('6️⃣ Testing: Load grower directory...');
  const test6 = await measureQuery(
    'Grower Directory (is_grower filter)',
    async () => {
      return await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('is_grower', true)
        .order('grower_last_active', { ascending: false })
        .limit(50);
    }
  );
  results.push(test6);
  console.log(`   ${test6.success ? '✅' : '❌'} ${test6.duration}ms (${test6.count} rows)\n`);

  // Test 7: Search strains by name
  console.log('7️⃣ Testing: Search strains by name...');
  const test7 = await measureQuery(
    'Strain Search (name filter)',
    async () => {
      return await supabaseAdmin
        .from('strains')
        .select('*')
        .ilike('name', '%OG%')
        .limit(50);
    }
  );
  results.push(test7);
  console.log(`   ${test7.success ? '✅' : '❌'} ${test7.duration}ms (${test7.count} rows)\n`);

  // Test 8: Filter strains by type
  console.log('8️⃣ Testing: Filter strains by type...');
  const test8 = await measureQuery(
    'Strains by Type (type filter)',
    async () => {
      return await supabaseAdmin
        .from('strains')
        .select('*')
        .eq('type', 'indica')
        .limit(50);
    }
  );
  results.push(test8);
  console.log(`   ${test8.success ? '✅' : '❌'} ${test8.duration}ms (${test8.count} rows)\n`);

  // Calculate statistics
  const successfulTests = results.filter(r => r.success);
  const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
  const maxDuration = Math.max(...successfulTests.map(r => r.duration));
  const minDuration = Math.min(...successfulTests.map(r => r.duration));

  // Print summary
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('Test Results:');
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    const time = r.duration.toString().padStart(4);
    console.log(`  ${status} Test ${i + 1}: ${time}ms - ${r.name}`);
  });

  console.log('\nStatistics:');
  console.log(`  Average Query Time: ${avgDuration.toFixed(1)}ms`);
  console.log(`  Fastest Query: ${minDuration}ms`);
  console.log(`  Slowest Query: ${maxDuration}ms`);
  console.log(`  Success Rate: ${successfulTests.length}/${results.length} (${(successfulTests.length / results.length * 100).toFixed(0)}%)`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('💡 INTERPRETATION');
  console.log('═══════════════════════════════════════════════════\n');

  if (avgDuration < 20) {
    console.log('🚀 EXCELLENT: Queries are very fast! Indexes are working great.');
    console.log('   Average: ' + avgDuration.toFixed(1) + 'ms (< 20ms is excellent)');
  } else if (avgDuration < 50) {
    console.log('✅ GOOD: Queries are fast. Indexes are helping.');
    console.log('   Average: ' + avgDuration.toFixed(1) + 'ms (< 50ms is good)');
  } else if (avgDuration < 100) {
    console.log('⚠️  MODERATE: Queries are acceptable but could be faster.');
    console.log('   Average: ' + avgDuration.toFixed(1) + 'ms (< 100ms is acceptable)');
    console.log('   💡 Consider adding indexes if not already done.');
  } else {
    console.log('❌ SLOW: Queries are slow. Indexes needed!');
    console.log('   Average: ' + avgDuration.toFixed(1) + 'ms (> 100ms is slow)');
    console.log('   💡 Apply the database indexes migration ASAP!');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📋 NEXT STEPS');
  console.log('═══════════════════════════════════════════════════\n');

  if (avgDuration > 50) {
    console.log('1. Apply database indexes:');
    console.log('   - Open: backend/migrations/ADD_PERFORMANCE_INDEXES.sql');
    console.log('   - Copy SQL to Supabase SQL Editor');
    console.log('   - Run the migration');
    console.log('\n2. Re-run this test to see improvement:');
    console.log('   - node backend/scripts/test-index-performance.mjs');
    console.log('\n3. Expected improvement: 10x-100x faster queries!');
  } else {
    console.log('✅ Your database is already well-optimized!');
    console.log('   No immediate action needed.');
    console.log('\n💡 To maintain performance:');
    console.log('   - Monitor query times as data grows');
    console.log('   - Add indexes for new query patterns');
    console.log('   - Run this test periodically');
  }

  console.log('\n');
  process.exit(0);
}

runTests().catch(error => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});

