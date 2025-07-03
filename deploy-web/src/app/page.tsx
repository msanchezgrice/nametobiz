'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';
import DomainUploader from '@/components/DomainUploader';
import EmailGate from '@/components/EmailGate';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    console.log('🎯 HomePage component mounted', {
      timestamp: new Date().toISOString(),
      location: window.location.href,
      userAgent: navigator.userAgent
    });

    const getUser = async () => {
      console.log('👤 Getting user from Supabase...');
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('👤 User fetch result:', { 
          hasUser: !!user, 
          userId: user?.id, 
          userEmail: user?.email,
          error: error?.message 
        });
        setUser(user);
      } catch (error) {
        console.error('❌ Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id 
        });
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleDomainsSubmit = async (domains: string[]) => {
    console.log('📤 Submitting domains:', { domains, timestamp: new Date().toISOString() });
    
    try {
      const response = await fetch('/api/start-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains }),
      });

      console.log('📥 API response:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('📄 Response data:', data);

      if (!response.ok) {
        console.error('❌ API request failed:', { status: response.status, data });
        throw new Error(data.error || 'Failed to submit domains');
      }

      console.log('✅ Job created, redirecting to:', `/job/${data.jobId}`);
      // Redirect to job status page
      router.push(`/job/${data.jobId}`);
    } catch (error) {
      console.error('🔥 Error submitting domains:', error);
      throw error;
    }
  };

  const handleAuthenticated = () => {
    console.log('✅ User authenticated successfully');
    // This will be called when user successfully authenticates
    // The useEffect above will handle updating the user state
  };

  if (isLoading) {
    console.log('⏳ Showing loading state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NametoBiz...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering main UI', { hasUser: !!user, userEmail: user?.email });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Domain to Prototype
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Turn your domains into fully-clickable, AI-generated website prototypes in minutes.
          </p>
        </div>

        {!user ? (
          <EmailGate onAuthenticated={handleAuthenticated} />
        ) : (
          <DomainUploader onDomainsSubmit={handleDomainsSubmit} />
        )}

        {user && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Signed in as {user.email}
            </p>
            <button
              onClick={() => {
                console.log('🚪 User signing out...');
                supabase.auth.signOut();
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Sign out
            </button>
          </div>
        )}
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <pre>{JSON.stringify({
              hasUser: !!user,
              userId: user?.id,
              userEmail: user?.email,
              isLoading,
              location: typeof window !== 'undefined' ? window.location.href : 'SSR',
              timestamp: new Date().toISOString()
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
