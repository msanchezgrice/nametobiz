import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/start-job - Request received', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'origin': request.headers.get('origin'),
      'content-type': request.headers.get('content-type'),
      'cookie': request.headers.get('cookie') ? '[PRESENT]' : '[MISSING]'
    }
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
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    const invalidDomains = domains.filter(domain => !domainRegex.test(domain.trim()));
    
    if (invalidDomains.length > 0) {
      console.warn('❌ Invalid domain format:', { invalidDomains });
      return NextResponse.json(
        { error: `Invalid domains: ${invalidDomains.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('🔗 Creating Supabase client...');
    console.log('🔍 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      deploymentEnv: process.env.VERCEL_ENV || 'local',
      nodeEnv: process.env.NODE_ENV
    });

    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    console.log('👤 Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('👤 User authentication result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError ? {
        message: userError.message,
        status: userError.status,
        code: 'code' in userError ? userError.code : undefined
      } : null
    });

    if (userError || !user) {
      console.warn('❌ Authentication failed:', { userError, hasUser: !!user });
      return NextResponse.json(
        { error: 'Authentication required', details: userError?.message },
        { status: 401 }
      );
    }

    // Create a new job
    console.log('💾 Creating job in database...');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        domains,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Database error:', {
        error: jobError,
        message: jobError.message,
        code: jobError.code,
        details: jobError.details
      });
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError.message },
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