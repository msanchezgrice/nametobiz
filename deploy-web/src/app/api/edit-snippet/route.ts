import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { prototypeId, path, html, instruction } = await request.json();

    // Validate required fields
    if (!prototypeId || !path || !html || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields: prototypeId, path, html, instruction' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Queue the edit job
    const editJob = {
      id: crypto.randomUUID(),
      user_id: user.id,
      prototype_id: prototypeId,
      path,
      html_snippet: html,
      instruction,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Store in database (we'll need to create this table)
    const { data, error } = await supabase
      .from('edit_jobs')
      .insert(editJob)
      .select()
      .single();

    if (error) {
      console.error('Error creating edit job:', error);
      return NextResponse.json(
        { error: 'Failed to queue edit job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: data.id,
      message: 'Edit job queued successfully'
    });

  } catch (error) {
    console.error('Error in edit-snippet API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get edit job status
    const { data, error } = await supabase
      .from('edit_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Edit job not found' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting edit job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 