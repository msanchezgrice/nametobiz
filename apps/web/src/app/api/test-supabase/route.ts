import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test basic connection - just check if we can connect, don't query auth-dependent tables
    const { error } = await supabase.from('jobs').select('id').limit(1);
    
    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          hint: 'Database connection issue'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful!',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tablesExist: true
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to Supabase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 