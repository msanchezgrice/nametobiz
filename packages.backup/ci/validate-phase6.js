#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Validation requirements for Phase 6
const PHASE_6_REQUIREMENTS = {
  performance: 90,
  accessibility: 90,
  bestPractices: 85,
  seo: 85,
  pwa: 70
};

// Test existing prototypes
const TEST_URLS = [
  'https://nametobiz-static-delivery.doodad.workers.dev/site/bundles/9370da42-6bab-4f40-b269-649c9afc170c/thinkingobjects.ai/Technical/index.html',
  'https://nametobiz-static-delivery.doodad.workers.dev/site/bundles/9370da42-6bab-4f40-b269-649c9afc170c/thinkingobjects.ai/Modern/index.html',
  'https://nametobiz-static-delivery.doodad.workers.dev/site/bundles/9370da42-6bab-4f40-b269-649c9afc170c/thinkingobjects.ai/Scientific/index.html'
];

async function testPrototype(url, index) {
  console.log(`\n🚀 Testing prototype ${index + 1}: ${url.split('/').slice(-2).join('/')}`);
  
  const reportFile = `./lighthouse-report-${index}.json`;
  
  try {
    // Run Lighthouse
    execSync(`npx lighthouse --chrome-flags="--headless --no-sandbox" --only-categories="performance,accessibility,best-practices,seo,pwa" --output=json --output-path="${reportFile}" "${url}"`, {
      stdio: 'pipe'
    });
    
    // Parse results
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const scores = {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories['best-practices'].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      pwa: Math.round(report.categories.pwa.score * 100)
    };
    
    console.log('📊 Scores:');
    console.log(`   Performance: ${scores.performance}/100 ${scores.performance >= PHASE_6_REQUIREMENTS.performance ? '✅' : '❌'}`);
    console.log(`   Accessibility: ${scores.accessibility}/100 ${scores.accessibility >= PHASE_6_REQUIREMENTS.accessibility ? '✅' : '❌'}`);
    console.log(`   Best Practices: ${scores.bestPractices}/100 ${scores.bestPractices >= PHASE_6_REQUIREMENTS.bestPractices ? '✅' : '❌'}`);
    console.log(`   SEO: ${scores.seo}/100 ${scores.seo >= PHASE_6_REQUIREMENTS.seo ? '✅' : '❌'}`);
    console.log(`   PWA: ${scores.pwa}/100 ${scores.pwa >= PHASE_6_REQUIREMENTS.pwa ? '✅' : '❌'}`);
    
    // Clean up report
    fs.unlinkSync(reportFile);
    
    return {
      url,
      scores,
      passed: Object.keys(PHASE_6_REQUIREMENTS).every(category => scores[category] >= PHASE_6_REQUIREMENTS[category])
    };
    
  } catch (error) {
    console.error('❌ Lighthouse test failed:', error.message);
    return { url, scores: {}, passed: false };
  }
}

async function validatePhase6() {
  console.log('🔍 Phase 6 PWA & Performance Validation');
  console.log('=' .repeat(50));
  console.log('Requirements:');
  console.log(`   Performance: ≥${PHASE_6_REQUIREMENTS.performance}`);
  console.log(`   Accessibility: ≥${PHASE_6_REQUIREMENTS.accessibility}`);
  console.log(`   Best Practices: ≥${PHASE_6_REQUIREMENTS.bestPractices}`);
  console.log(`   SEO: ≥${PHASE_6_REQUIREMENTS.seo}`);
  console.log(`   PWA: ≥${PHASE_6_REQUIREMENTS.pwa}`);
  
  const results = [];
  for (let i = 0; i < TEST_URLS.length; i++) {
    const result = await testPrototype(TEST_URLS[i], i);
    results.push(result);
  }
  
  console.log('\n📋 Summary:');
  console.log('=' .repeat(50));
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`${passedCount}/${results.length} prototypes passed all requirements`);
  
  if (passedCount === results.length) {
    console.log('\n🎉 Phase 6 Validation: PASSED');
    console.log('All prototypes meet PWA and performance requirements!');
    return true;
  } else {
    console.log('\n❌ Phase 6 Validation: FAILED');
    console.log('Some prototypes need improvement.');
    return false;
  }
}

// Run validation
validatePhase6()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }); 