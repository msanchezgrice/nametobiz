-- Database webhook setup for Phase 7 Email Notifications
-- This creates a webhook that triggers when jobs.status changes to 'bundles_ready'

-- First, create the webhook function URL (replace with your actual Supabase Edge Function URL)
-- For local development: http://localhost:54321/functions/v1/notify-user
-- For production: https://[your-project-id].supabase.co/functions/v1/notify-user

-- Example webhook creation (run this in Supabase Dashboard -> Database -> Webhooks)
/*
INSERT INTO supabase_hooks.hooks (
  hook_table_id,
  hook_name,
  type,
  events,
  config
) VALUES (
  (SELECT id FROM information_schema.tables WHERE table_name = 'jobs'),
  'notify-user-job-complete',
  'http',
  ARRAY['UPDATE'],
  '{
    "url": "https://[your-project-id].supabase.co/functions/v1/notify-user",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer [your-service-role-key]"
    },
    "timeout_ms": 5000
  }'::jsonb
);
*/

-- Alternative: Create via Supabase Dashboard
-- 1. Go to Database > Webhooks
-- 2. Create new webhook with:
--    Name: notify-user-job-complete
--    Table: jobs
--    Events: Update
--    URL: https://[your-project-id].supabase.co/functions/v1/notify-user
--    HTTP Headers: Authorization: Bearer [service-role-key]

-- For testing: You can manually trigger an email by updating a job status
-- UPDATE jobs SET status = 'bundles_ready' WHERE id = '[some-job-id]' AND email_sent = false; 