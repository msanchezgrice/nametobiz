import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/start-job - Request received', {
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    const { domains } = await request.json();
    console.log('📝 Request payload:', { domains });

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      console.warn('❌ Invalid domains payload:', { domains });
      return NextResponse.json(
        { error: 'Domains array is required' },
        { status: 400 }
      );
    }

    if (domains.length > 10) {
      console.warn('❌ Too many domains:', { count: domains.length });
      return NextResponse.json(
        { error: 'Maximum 10 domains allowed' },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9.-]+\\.[a-z]{2,}$/i;
    const invalidDomains = domains.filter(domain => !domainRegex.test(domain.trim()));
    
    if (invalidDomains.length > 0) {
      console.warn('❌ Invalid domain format:', { invalidDomains });
      return NextResponse.json(
        { error: `Invalid domain format: ${invalidDomains.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('🔗 Creating Supabase client...');
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('🔍 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      deploymentEnv: process.env.VERCEL_ENV || 'local'
    });

    // Insert job into database
    console.log('💾 Inserting job into database...');
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        domains: domains.map(d => d.trim()),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      });
      return NextResponse.json(
        { error: 'Failed to create job', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ Job created successfully:', { jobId: job.id });
    return NextResponse.json({ jobId: job.id });

  } catch (error) {
    console.error('🔥 Unexpected error in /api/start-job:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 