#!/usr/bin/env node

/**
 * Startup Test Script
 * Tests if all new modules can be loaded without errors
 */

console.log('🧪 Testing module imports...\n');

const tests = [
  {
    name: 'Config',
    fn: () => require('./src/lib/config')
  },
  {
    name: 'Redis',
    fn: () => require('./src/lib/redis')
  },
  {
    name: 'Queue',
    fn: () => require('./src/lib/queue')
  },
  {
    name: 'Route Service',
    fn: () => require('./src/lib/routeService')
  },
  {
    name: 'Payment Service',
    fn: () => require('./src/lib/paymentService')
  },
  {
    name: 'Rate Limiter Middleware',
    fn: () => require('./src/middleware/rateLimiter')
  },
  {
    name: 'Payment Controller',
    fn: () => require('./src/controllers/paymentController')
  },
  {
    name: 'Payment Routes',
    fn: () => require('./src/routes/payment')
  },
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  try {
    test.fn();
    console.log(`✅ ${test.name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${test.name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All modules loaded successfully!');
  console.log('✅ Ready to start the server with: npm run dev\n');
  process.exit(0);
} else {
  console.log('⚠️  Some modules failed to load. Please check errors above.\n');
  process.exit(1);
}
