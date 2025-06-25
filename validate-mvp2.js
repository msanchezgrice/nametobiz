#!/usr/bin/env node

/**
 * MVP2.md Validation Script
 * Tests all the conversion-first enhancements and new edit workflow
 */

console.log('🧪 MVP2.md Validation - Conversion-First Design');
console.log('===============================================');

import { promises as fs } from 'fs';
import path from 'path';

// Test 1: Validate enhanced ThemeSpec interface
async function validateThemeSpecInterface() {
  console.log('\n📋 1. ThemeSpec Interface Validation:');
  
  try {
    const builderAgentPath = path.join(process.cwd(), 'packages/llm/src/builderAgent.ts');
    const content = await fs.readFile(builderAgentPath, 'utf8');
    
    const requiredFields = [
      'hero_visual: string',
      'social_proof: string[]',
      'faq_entries: Array<{ q: string; a: string }>',
      'primary_cta: string'
    ];
    
    let score = 0;
    requiredFields.forEach(field => {
      if (content.includes(field)) {
        console.log(`   ✅ ${field}`);
        score++;
      } else {
        console.log(`   ❌ ${field} - Missing`);
      }
    });
    
    console.log(`   📊 ThemeSpec Score: ${score}/${requiredFields.length}`);
    return score === requiredFields.length;
    
  } catch (error) {
    console.log(`   ❌ Error reading BuilderAgent: ${error.message}`);
    return false;
  }
}

// Test 2: Validate enhanced Thinking-Agent prompt
async function validateThinkingAgentPrompt() {
  console.log('\n🤖 2. Thinking-Agent v2 Prompt Validation:');
  
  try {
    const anthropicPath = path.join(process.cwd(), 'packages/llm/src/anthropic.ts');
    const content = await fs.readFile(anthropicPath, 'utf8');
    
    const requiredPromptElements = [
      'conversion-optimized startup ideas',
      'hero_visual',
      'social_proof',
      'faq_entries',
      'primary_cta',
      'Unsplash API',
      'testimonials must include specific',
      'FAQ entries must address real user concerns'
    ];
    
    let score = 0;
    requiredPromptElements.forEach(element => {
      if (content.includes(element)) {
        console.log(`   ✅ ${element}`);
        score++;
      } else {
        console.log(`   ❌ ${element} - Missing`);
      }
    });
    
    console.log(`   📊 Thinking Prompt Score: ${score}/${requiredPromptElements.length}`);
    return score >= 6; // Allow some flexibility
    
  } catch (error) {
    console.log(`   ❌ Error reading Anthropic client: ${error.message}`);
    return false;
  }
}

// Test 3: Validate conversion-first BuilderAgent
async function validateBuilderAgentPrompt() {
  console.log('\n🎨 3. Builder-Agent v2 Conversion-First Validation:');
  
  try {
    const builderAgentPath = path.join(process.cwd(), 'packages/llm/src/builderAgent.ts');
    const content = await fs.readFile(builderAgentPath, 'utf8');
    
    const conversionFeatures = [
      'SiteBuilder v2 (MVP2.md)',
      'conversion-optimized landing pages',
      'visual polish and user engagement',
      'Unsplash',
      'font-display: swap',
      'testimonial block',
      'FAQ accordion',
      'theme.primary_cta',
      'Design > byte-budget',
      'Visual QA CHECKLIST'
    ];
    
    let score = 0;
    conversionFeatures.forEach(feature => {
      if (content.includes(feature)) {
        console.log(`   ✅ ${feature}`);
        score++;
      } else {
        console.log(`   ❌ ${feature} - Missing`);
      }
    });
    
    console.log(`   📊 Builder Conversion Score: ${score}/${conversionFeatures.length}`);
    return score >= 8;
    
  } catch (error) {
    console.log(`   ❌ Error reading BuilderAgent: ${error.message}`);
    return false;
  }
}

// Test 4: Validate relaxed performance thresholds
async function validatePerformanceThresholds() {
  console.log('\n⚡ 4. Performance Threshold Validation:');
  
  try {
    const lighthousePath = path.join(process.cwd(), 'packages/ci/lh.config.js');
    const content = await fs.readFile(lighthousePath, 'utf8');
    
    const performanceChecks = [
      { check: 'minScore: 0.7', desc: 'Performance threshold ≥70%' },
      { check: 'cumulative-layout-shift', desc: 'CLS requirement added' },
      { check: 'maxNumericValue: 0.1', desc: 'CLS threshold ≤0.1' },
      { check: 'prioritize visual polish', desc: 'Design-first comment' }
    ];
    
    let score = 0;
    performanceChecks.forEach(({ check, desc }) => {
      if (content.includes(check)) {
        console.log(`   ✅ ${desc}`);
        score++;
      } else {
        console.log(`   ❌ ${desc} - Missing`);
      }
    });
    
    console.log(`   📊 Performance Config Score: ${score}/${performanceChecks.length}`);
    return score >= 3;
    
  } catch (error) {
    console.log(`   ❌ Error reading Lighthouse config: ${error.message}`);
    return false;
  }
}

// Test 5: Validate Edit-Agent workflow (Phase 7b)
async function validateEditWorkflow() {
  console.log('\n✏️ 5. Edit-Agent Workflow Validation (Phase 7b):');
  
  const editFiles = [
    { 
      path: 'apps/worker/src/editAgent.ts', 
      checks: ['EditAgent', 'processEditJob', 'HTMLEditor v1', 'revised HTML']
    },
    { 
      path: 'apps/web/src/components/EditOverlay.tsx', 
      checks: ['EditOverlay', 'Edit Mode', 'right-click', 'edit-snippet']
    },
    { 
      path: 'apps/web/src/app/api/edit-snippet/route.ts', 
      checks: ['edit_jobs', 'POST', 'GET', 'prototype_id']
    }
  ];
  
  let totalScore = 0;
  let totalChecks = 0;
  
  for (const { path: filePath, checks } of editFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      console.log(`   📄 ${filePath}:`);
      let fileScore = 0;
      
      checks.forEach(check => {
        if (content.includes(check)) {
          console.log(`      ✅ ${check}`);
          fileScore++;
        } else {
          console.log(`      ❌ ${check} - Missing`);
        }
      });
      
      totalScore += fileScore;
      totalChecks += checks.length;
      
    } catch (error) {
      console.log(`   ❌ Error reading ${filePath}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Edit Workflow Score: ${totalScore}/${totalChecks}`);
  return totalScore >= totalChecks * 0.8; // 80% threshold
}

// Test 6: Validate database schema for edit jobs
async function validateDatabaseSchema() {
  console.log('\n🗄️ 6. Database Schema Validation:');
  
  try {
    const schemaPath = path.join(process.cwd(), 'docs/database/schema.sql');
    const content = await fs.readFile(schemaPath, 'utf8');
    
    const schemaChecks = [
      'create table edit_jobs',
      'prototype_id text not null',
      'html_snippet text not null',
      'instruction text not null', 
      'revised_html text',
      'status text default \'pending\'',
      'idx_edit_jobs_user_id',
      'alter publication supabase_realtime add table edit_jobs'
    ];
    
    let score = 0;
    schemaChecks.forEach(check => {
      if (content.includes(check)) {
        console.log(`   ✅ ${check}`);
        score++;
      } else {
        console.log(`   ❌ ${check} - Missing`);
      }
    });
    
    console.log(`   📊 Database Schema Score: ${score}/${schemaChecks.length}`);
    return score >= 7;
    
  } catch (error) {
    console.log(`   ❌ Error reading schema: ${error.message}`);
    return false;
  }
}

// Main validation function
async function runValidation() {
  const tests = [
    { name: 'ThemeSpec Interface', fn: validateThemeSpecInterface },
    { name: 'Thinking-Agent v2', fn: validateThinkingAgentPrompt },
    { name: 'Builder-Agent Conversion', fn: validateBuilderAgentPrompt },
    { name: 'Performance Thresholds', fn: validatePerformanceThresholds },
    { name: 'Edit Workflow', fn: validateEditWorkflow },
    { name: 'Database Schema', fn: validateDatabaseSchema }
  ];
  
  let passedTests = 0;
  
  for (const { name, fn } of tests) {
    try {
      const result = await fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`   ❌ ${name} test failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 MVP2.md Validation Summary:');
  console.log(`   📊 Tests Passed: ${passedTests}/${tests.length}`);
  console.log(`   📈 Success Rate: ${Math.round(passedTests/tests.length*100)}%`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 SUCCESS! MVP2.md implementation is complete and validated!');
    console.log('\n📋 Next Steps:');
    console.log('   🔄 Test with real domains to verify conversion-first design');
    console.log('   📧 Ensure email notifications work with enhanced content');
    console.log('   ✏️ Test edit workflow with right-click functionality');
    console.log('   💰 Ready for Phase 8 - Paywall integration');
  } else {
    console.log('\n⚠️ Some MVP2.md features need attention. Please review failed tests above.');
  }
  
  console.log('\n✅ Validation complete!');
}

// Run the validation
runValidation().catch(console.error); 