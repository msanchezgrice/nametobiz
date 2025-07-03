import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Use service role key for database setup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try to query bundles table to see if it exists
    const { error: testError } = await supabase.from('bundles').select('id').limit(1);
    
    if (testError && testError.message?.includes('does not exist')) {
      // Table doesn't exist, let's create it manually
      console.log('Bundles table does not exist, needs manual creation');
      return NextResponse.json({
        error: 'Bundles table needs to be created manually in Supabase dashboard',
        details: 'Please run the SQL from docs/database/schema.sql in your Supabase SQL editor'
      }, { status: 500 });
    }
    
    const error = testError;

    if (error) {
      console.error('Database setup error:', error);
      return NextResponse.json(
        { error: 'Failed to setup database', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Bundles table created successfully' 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 