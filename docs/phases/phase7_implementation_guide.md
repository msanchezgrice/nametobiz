# Phase 7 Implementation Guide - Email Notifications

## Overview
Phase 7 adds automated email notifications when prototype generation is complete. When a job status changes to `'bundles_ready'`, users receive a beautiful HTML email with their results.

## Architecture
- **Supabase Edge Function**: `notify-user` handles email sending
- **Database Webhook**: Automatically triggers when `jobs.status = 'bundles_ready'`
- **Postmark Integration**: Professional email delivery service
- **Email Template**: HTML/Text with domain list and CTA button

## Implementation Steps

### 1. Deploy Supabase Edge Function

```bash
# Deploy the edge function to Supabase
supabase functions deploy notify-user

# Set environment variables
supabase secrets set POSTMARK_API_KEY=your_postmark_server_token
supabase secrets set FRONTEND_URL=https://your-domain.com
```

### 2. Set up Postmark Account

1. Sign up at [Postmark](https://postmarkapp.com/)
2. Create a new server for transactional emails
3. Get your Server Token from the API Tokens section
4. Add your domain and verify DNS records (optional but recommended)

### 3. Configure Database Webhook

**Option A: Via Supabase Dashboard**
1. Go to Database > Webhooks
2. Create new webhook:
   - **Name**: `notify-user-job-complete`
   - **Table**: `jobs`
   - **Events**: `Update`
   - **URL**: `https://[your-project-id].supabase.co/functions/v1/notify-user`
   - **HTTP Headers**: 
     ```
     Content-Type: application/json
     Authorization: Bearer [your-service-role-key]
     ```

**Option B: Via SQL (run in SQL Editor)**
```sql
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
  jsonb_build_object(
    'url', 'https://[your-project-id].supabase.co/functions/v1/notify-user',
    'method', 'POST',
    'headers', jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [your-service-role-key]'
    ),
    'timeout_ms', 5000
  )
);
```

### 4. Environment Variables

Add these to your environment:

```env
# Postmark email service
POSTMARK_API_KEY=your_postmark_server_token

# Frontend URL for email links  
FRONTEND_URL=https://your-domain.com

# Supabase (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Email Template Features

The notification email includes:
- ✅ **Professional HTML design** with gradients and styling
- ✅ **Personalized greeting** with user's name if available
- ✅ **Domain list** showing all processed domains
- ✅ **Feature highlights** (PWA, responsive, interactive)
- ✅ **Call-to-action button** linking to job results
- ✅ **Plain text fallback** for email clients that don't support HTML
- ✅ **Responsive design** for mobile email clients

## Testing

### Manual Testing
```sql
-- Manually trigger an email for testing
UPDATE jobs 
SET status = 'bundles_ready' 
WHERE id = 'your-test-job-id' 
AND email_sent = false;
```

### Validation Checklist
- [ ] Edge function deploys successfully
- [ ] Postmark account configured with valid API key
- [ ] Database webhook created and active
- [ ] Environment variables set correctly
- [ ] Test email sent and received
- [ ] Email renders correctly in major email clients
- [ ] `email_sent` flag updates to `true` after sending
- [ ] No duplicate emails sent for same job

## Monitoring

### Function Logs
```bash
# View edge function logs
supabase functions logs notify-user --follow
```

### Database Queries
```sql
-- Check jobs ready for email notification
SELECT id, domains, status, email_sent, created_at 
FROM jobs 
WHERE status = 'bundles_ready' AND email_sent = false;

-- Check recent email activity
SELECT id, domains, status, email_sent, created_at 
FROM jobs 
WHERE email_sent = true 
ORDER BY created_at DESC 
LIMIT 10;
```

### Webhook Status
Check webhook delivery status in Supabase Dashboard > Database > Webhooks

## Troubleshooting

### Common Issues

**Email not sending:**
- Check Postmark API key is correct
- Verify webhook is configured and active
- Check edge function logs for errors
- Ensure user has valid email address

**Duplicate emails:**
- Verify `email_sent` flag is being updated
- Check webhook isn't triggering multiple times
- Review edge function logic for duplicate prevention

**Email not received:**
- Check spam folder
- Verify email address in user profile
- Check Postmark delivery logs
- Test with different email providers

## Email Content Customization

The email template can be customized by editing:
- `supabase/functions/notify-user/index.ts` - HTML and text content
- Postmark templates (if you prefer template-based approach)
- CSS styling within the HTML template

## Next Steps

After Phase 7 completion:
- **Phase 8**: Paywall integration
- **Phase 9**: CI/CD and observability
- Consider adding email preferences/unsubscribe functionality
- Add email analytics and tracking (open rates, clicks)

## Production Considerations

- Set up proper DNS records for your domain in Postmark
- Configure DKIM and SPF records for better deliverability  
- Monitor bounce rates and email reputation
- Consider rate limiting for high-volume scenarios
- Set up monitoring alerts for failed email deliveries 