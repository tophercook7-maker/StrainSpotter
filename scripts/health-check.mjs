#!/usr/bin/env node
/**
 * App Health Check - Verify all features work without errors
 * Tests all API endpoints and reports any failures
 */

const API_BASE = 'http://localhost:5181';

const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    expect: { ok: true }
  },
  {
    name: 'Strain Count',
    method: 'GET',
    url: '/api/strains/count',
    expect: (data) => data.count > 0
  },
  {
    name: 'Strains List',
    method: 'GET',
    url: '/api/strains?limit=5',
    expect: (data) => Array.isArray(data) && data.length > 0
  },
  {
    name: 'Dispensaries List',
    method: 'GET',
    url: '/api/dispensaries',
    expect: (data) => Array.isArray(data)
  },
  {
    name: 'Seeds Providers',
    method: 'GET',
    url: '/api/seeds',
    expect: (data) => Array.isArray(data.providers)
  },
  {
    name: 'Groups List',
    method: 'GET',
    url: '/api/groups',
    expect: (data) => Array.isArray(data)
  },
  {
    name: 'Pipeline Status',
    method: 'GET',
    url: '/api/pipeline/latest',
    expect: (data) => data !== null
  },
  {
    name: 'Membership Status (anon)',
    method: 'GET',
    url: '/api/membership/status',
    headers: { 'x-session-id': 'test-session' },
    expect: (data) => data.status !== undefined
  }
];

async function runTest(test) {
  try {
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...(test.headers || {})
      }
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const res = await fetch(`${API_BASE}${test.url}`, options);
    const data = await res.json();

    if (!res.ok) {
      return { passed: false, error: `HTTP ${res.status}: ${data.error || data.message || 'Unknown error'}` };
    }

    // Check expectation
    let passed = false;
    if (typeof test.expect === 'function') {
      passed = test.expect(data);
    } else {
      passed = JSON.stringify(test.expect) === JSON.stringify(data);
    }

    return { passed, data: passed ? null : data };
  } catch (err) {
    return { passed: false, error: err.message };
  }
}

async function runAllTests() {
  console.log('🧪 StrainSpotter Health Check\n');
  console.log(`API Base: ${API_BASE}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`${test.name}...`.padEnd(35));
    const result = await runTest(test);

    if (result.passed) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.data) {
        console.log(`   Got: ${JSON.stringify(result.data).substring(0, 100)}`);
      }
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All systems operational!\n');
    console.log('Next steps:');
    console.log('  1. Test mobile UI at: http://localhost:4173');
    console.log('  2. Test on phone at: http://192.168.1.205:4173');
    console.log('  3. Check DevTools for console errors');
    console.log('  4. Run Lighthouse audit for performance\n');
  } else {
    console.log('⚠️  Some features need attention. Check errors above.\n');
    if (failed > 5) {
      console.log('💡 Is the backend running? Start it with:');
      console.log('   cd backend && npm run dev\n');
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch(err => {
  console.error('💥 Test suite failed:', err);
  process.exit(1);
});
