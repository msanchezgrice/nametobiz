import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  jobId: string
  userEmail: string
  userName?: string
  prototypesCount: number
  domains: string[]
}

async function sendNotificationEmail(payload: EmailPayload) {
  const postmarkApiKey = Deno.env.get('POSTMARK_API_KEY')
  if (!postmarkApiKey) {
    throw new Error('POSTMARK_API_KEY not configured')
  }

  const emailData = {
    From: 'noreply@nametobiz.com',
    To: payload.userEmail,
    Subject: `🚀 Your ${payload.prototypesCount} website prototypes are ready!`,
    HtmlBody: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Prototypes Are Ready</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .domain-list { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Website Prototypes Are Ready!</h1>
            <p>We've generated ${payload.prototypesCount} unique prototypes for your domains</p>
          </div>
          
          <div class="content">
            <p>Hi${payload.userName ? ` ${payload.userName}` : ''}! 👋</p>
            
            <p>Great news! We've successfully analyzed your domains and created interactive website prototypes for:</p>
            
            <div class="domain-list">
              ${payload.domains.map(domain => `<div>• <strong>${domain}</strong></div>`).join('')}
            </div>
            
            <p>Each domain has been transformed into <strong>3 different themes</strong> with:</p>
            <ul>
              <li>✅ Complete HTML, CSS, and JavaScript</li>
              <li>✅ Interactive navigation and forms</li>
              <li>✅ PWA-ready with offline caching</li>
              <li>✅ Mobile-responsive design</li>
              <li>✅ Optimized for performance</li>
            </ul>
            
            <p>Click the button below to view and interact with your prototypes:</p>
            
            <a href="${Deno.env.get('FRONTEND_URL')}/job/${payload.jobId}" class="cta-button">
              View My Prototypes →
            </a>
            
            <p><small>This link will take you to your personal dashboard where you can preview, interact with, and download your prototypes.</small></p>
          </div>
          
          <div class="footer">
            <p>Made with ❤️ by NametoBiz</p>
            <p>Turning domains into prototypes, one idea at a time.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    TextBody: `
🎉 Your Website Prototypes Are Ready!

Hi${payload.userName ? ` ${payload.userName}` : ''}!

Great news! We've successfully analyzed your domains and created ${payload.prototypesCount} interactive website prototypes.

Domains processed:
${payload.domains.map(domain => `• ${domain}`).join('\n')}

Each domain has been transformed into 3 different themes with:
✅ Complete HTML, CSS, and JavaScript
✅ Interactive navigation and forms  
✅ PWA-ready with offline caching
✅ Mobile-responsive design
✅ Optimized for performance

View your prototypes: ${Deno.env.get('FRONTEND_URL')}/job/${payload.jobId}

Made with ❤️ by NametoBiz
    `,
    MessageStream: 'outbound'
  }

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': postmarkApiKey,
    },
    body: JSON.stringify(emailData),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Postmark API error: ${response.status} - ${errorData}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the webhook payload
    const payload = await req.json()
    console.log('📧 Email notification webhook triggered:', payload)

    // Handle database webhook from jobs table
    if (payload.table === 'jobs' && payload.type === 'UPDATE') {
      const job = payload.record
      const oldJob = payload.old_record

      // Only process if status changed to 'bundles_ready' and email not yet sent
      if (job.status === 'bundles_ready' && 
          oldJob.status !== 'bundles_ready' && 
          !job.email_sent) {
        
        console.log(`📧 Processing email for job ${job.id}`)

        // Get user details
        const { data: user } = await supabase.auth.admin.getUserById(job.user_id)
        if (!user) {
          throw new Error(`User not found: ${job.user_id}`)
        }

        // Get bundles count
        const { count: bundlesCount } = await supabase
          .from('bundles')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)

        // Send notification email
        const emailPayload: EmailPayload = {
          jobId: job.id,
          userEmail: user.user.email!,
          userName: user.user.user_metadata?.name,
          prototypesCount: bundlesCount || 0,
          domains: job.domains
        }

        await sendNotificationEmail(emailPayload)
        console.log(`📧 Email sent to ${emailPayload.userEmail}`)

        // Update email_sent flag
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ email_sent: true })
          .eq('id', job.id)

        if (updateError) {
          console.error('❌ Failed to update email_sent flag:', updateError)
        } else {
          console.log(`✅ Email sent flag updated for job ${job.id}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Email notification error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 