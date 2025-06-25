#!/usr/bin/env node

const { execSync } = require('child_process');

// Test URLs for generated prototypes
const TEST_URLS = [
  'https://nametobiz-static-delivery.doodad.workers.dev/site/bundles/9370da42-6bab-4f40-b269-649c9afc170c/thinkingobjects.ai/Technical/index.html',
  'https://nametobiz-static-delivery.doodad.workers.dev/site/bundles/9370da42-6bab-4f40-b269-649c9afc170c/thinkingobjects.ai/Modern/index.html'
];

async function testPrototype(url) {
  console.log(`🚀 Testing prototype: ${url}`);
  
  try {
    // Run Lighthouse CI
    const result = execSync(`npx lhci autorun --url="${url}" --config=lh.config.js`, {
      encoding: 'utf8',
      cwd: __dirname
    });
    
    console.log('✅ Lighthouse test passed!');
    console.log(result);
    return true;
  } catch (error) {
    console.error('❌ Lighthouse test failed:');
    console.error(error.stdout || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Running Phase 6 PWA & Performance validation...\n');
  
  let passed = 0;
  for (const url of TEST_URLS) {
    const success = await testPrototype(url);
    if (success) passed++;
    console.log('─'.repeat(50));
  }
  
  console.log(`\n📊 Results: ${passed}/${TEST_URLS.length} prototypes passed performance tests`);
  
  if (passed === TEST_URLS.length) {
    console.log('🎉 Phase 6 validation complete! All prototypes meet performance requirements.');
    process.exit(0);
  } else {
    console.log('❌ Some prototypes failed performance tests. See logs above.');
    process.exit(1);
  }
}

runTests(); 