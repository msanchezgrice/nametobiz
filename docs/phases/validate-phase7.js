#!/usr/bin/env node

/**
 * Phase 7 Validation Script - Email Notifications
 * Tests the email notification system when jobs are completed
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Creates a test job and updates it to trigger email notification
 */
async function testEmailNotification() {
  console.log('🧪 Phase 7 Email Notification Test');
  console.log('====================================');

  try {
    // 1. Create a test user (if needed)
    console.log('1️⃣ Creating test user...');
    const testEmail = `test+${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: { name: 'Test User' }
    });

    if (authError) {
      console.error('❌ Failed to create test user:', authError);
      return false;
    }

    const userId = authData.user.id;
    console.log(`✅ Test user created: ${testEmail} (${userId})`);

    // 2. Create a test job
    console.log('2️⃣ Creating test job...');
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        domains: ['test1.com', 'test2.com', 'test3.com'],
        status: 'processing',
        email_sent: false
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Failed to create test job:', jobError);
      return false;
    }

    const jobId = jobData.id;
    console.log(`✅ Test job created: ${jobId}`);

    // 3. Create some test bundles
    console.log('3️⃣ Creating test bundles...');
    const testBundles = [
      {
        job_id: jobId,
        domain: 'test1.com',
        theme_name: 'Professional',
        bundle_key: `bundles/${jobId}/test1.com/Professional`,
        preview_url: `https://example.com/site/bundles/${jobId}/test1.com/Professional/index.html`
      },
      {
        job_id: jobId,
        domain: 'test1.com', 
        theme_name: 'Modern',
        bundle_key: `bundles/${jobId}/test1.com/Modern`,
        preview_url: `https://example.com/site/bundles/${jobId}/test1.com/Modern/index.html`
      },
      {
        job_id: jobId,
        domain: 'test2.com',
        theme_name: 'Creative',
        bundle_key: `bundles/${jobId}/test2.com/Creative`,
        preview_url: `https://example.com/site/bundles/${jobId}/test2.com/Creative/index.html`
      }
    ];

    const { error: bundlesError } = await supabase
      .from('bundles')
      .insert(testBundles);

    if (bundlesError) {
      console.error('❌ Failed to create test bundles:', bundlesError);
      return false;
    }

    console.log(`✅ Created ${testBundles.length} test bundles`);

    // 4. Wait a moment, then trigger the email by updating job status
    console.log('4️⃣ Waiting 2 seconds before triggering email...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('5️⃣ Updating job status to bundles_ready (this should trigger email)...');
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'bundles_ready' })
      .eq('id', jobId);

    if (updateError) {
      console.error('❌ Failed to update job status:', updateError);
      return false;
    }

    console.log('✅ Job status updated to bundles_ready');

    // 6. Wait for webhook to process and check if email_sent flag was updated
    console.log('6️⃣ Waiting 10 seconds for webhook to process...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const { data: updatedJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch updated job:', fetchError);
      return false;
    }

    console.log('\n📊 Final job status:');
    console.log(`   Status: ${updatedJob.status}`);
    console.log(`   Email sent: ${updatedJob.email_sent}`);
    console.log(`   User email: ${testEmail}`);
    console.log(`   Domains: ${updatedJob.domains.join(', ')}`);

    if (updatedJob.email_sent) {
      console.log('\n🎉 SUCCESS! Email notification was triggered successfully!');
      console.log(`📧 Check inbox for: ${testEmail}`);
      return true;
    } else {
      console.log('\n❌ FAILURE: Email was not sent. Check:');
      console.log('   - Database webhook is configured');
      console.log('   - Supabase Edge Function is deployed');
      console.log('   - POSTMARK_API_KEY is set');
      console.log('   - Function logs for errors');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

/**
 * Check system configuration
 */
async function checkConfiguration() {
  console.log('🔍 Checking Phase 7 Configuration');
  console.log('==================================');

  const checks = [];

  // Check database connection
  try {
    const { data, error } = await supabase.from('jobs').select('count').limit(1);
    checks.push({
      name: 'Database Connection',
      status: !error,
      message: error ? error.message : 'Connected successfully'
    });
  } catch (err) {
    checks.push({
      name: 'Database Connection',
      status: false,
      message: err.message
    });
  }

  // Check if bundles table exists
  try {
    const { data, error } = await supabase.from('bundles').select('count').limit(1);
    checks.push({
      name: 'Bundles Table',
      status: !error,
      message: error ? 'Table missing or inaccessible' : 'Table exists'
    });
  } catch (err) {
    checks.push({
      name: 'Bundles Table',
      status: false,
      message: 'Table missing'
    });
  }

  // Check environment variables
  checks.push({
    name: 'SUPABASE_URL',
    status: !!process.env.SUPABASE_URL,
    message: process.env.SUPABASE_URL ? 'Set' : 'Missing'
  });

  checks.push({
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    status: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    message: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
  });

  checks.push({
    name: 'POSTMARK_API_KEY',
    status: !!process.env.POSTMARK_API_KEY,
    message: process.env.POSTMARK_API_KEY ? 'Set' : 'Missing (required for email)'
  });

  checks.push({
    name: 'FRONTEND_URL',
    status: !!process.env.FRONTEND_URL,
    message: process.env.FRONTEND_URL ? process.env.FRONTEND_URL : 'Missing (required for email links)'
  });

  // Display results
  console.log('');
  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
  });

  const allGood = checks.every(check => check.status);
  console.log('');
  console.log(allGood ? '🎉 All checks passed!' : '⚠️  Some issues found - fix them before running tests');
  
  return allGood;
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  
  if (command === 'check') {
    await checkConfiguration();
  } else if (command === 'test') {
    const configOk = await checkConfiguration();
    if (configOk) {
      console.log('\n');
      await testEmailNotification();
    }
  } else {
    console.log('Phase 7 Email Notification Validator');
    console.log('');
    console.log('Usage:');
    console.log('  node validate-phase7.js check  # Check configuration');
    console.log('  node validate-phase7.js test   # Run full email test');
    console.log('');
    console.log('Environment variables required:');
    console.log('  SUPABASE_URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY');
    console.log('  POSTMARK_API_KEY');
    console.log('  FRONTEND_URL');
  }
}

main().catch(console.error); 