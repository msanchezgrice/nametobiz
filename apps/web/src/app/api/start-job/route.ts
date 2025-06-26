import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { domains } = await request.json();

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: 'Domains array is required' },
        { status: 400 }
      );
    }

    if (domains.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 domains allowed' },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    const invalidDomains = domains.filter(domain => !domainRegex.test(domain.trim()));
    
    if (invalidDomains.length > 0) {
      return NextResponse.json(
        { error: `Invalid domains: ${invalidDomains.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create a new job
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
      console.error('Database error:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobId: job.id });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 