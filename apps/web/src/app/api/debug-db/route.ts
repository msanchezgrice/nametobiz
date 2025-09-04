import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get all jobs for this user
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get all bundles for this user's jobs
    const { data: bundles, error: bundlesError } = await supabase
      .from('bundles')
      .select('*, jobs!inner(user_id)')
      .eq('jobs.user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      jobs: jobs || [],
      bundles: bundles || [],
      jobsError: jobsError?.message,
      bundlesError: bundlesError?.message
    });

  } catch (error) {
    console.error('Debug DB error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to query database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
