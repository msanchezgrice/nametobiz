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
      <div className="min-h-screen bg-[#f7f2ea] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-amber-400 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading NametoBiz...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering main UI', { hasUser: !!user, userEmail: user?.email });

  return (
    <div className="min-h-screen bg-[#f7f2ea] text-slate-900 relative overflow-hidden">
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-300/25 blur-3xl"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/70 flex items-center justify-center font-semibold">
              NB
            </div>
            <div>
              <div className="text-lg font-semibold">NametoBiz</div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Domain to Prototype</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">
            <span className="px-3 py-2 rounded-full border border-slate-200 bg-white/70">AI Generated</span>
            <span className="px-3 py-2 rounded-full border border-slate-200 bg-white/70">Prototype Ready</span>
          </div>
        </header>

        <div className="mt-14 grid lg:grid-cols-[1.1fr,0.9fr] gap-12 items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              Rapid validation
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight mt-6">
              Turn dormant domains into clickable product stories.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-2xl">
              Drop in up to 10 domains and get a prototype pack: positioning, homepage concept, and
              a momentum plan so you can decide what to ship next.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm text-slate-700">
              {[
                { stat: "10", label: "Domains per run" },
                { stat: "3", label: "Top picks delivered" },
                { stat: "1", label: "Plan per domain" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="text-2xl font-semibold text-slate-900">{item.stat}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
              <strong className="text-slate-900">Example:</strong> paste your domains, get a prototype,
              a launch angle, and a micro-roadmap in minutes.
            </div>
          </div>

          <div>
            {!user ? (
              <EmailGate onAuthenticated={handleAuthenticated} />
            ) : (
              <DomainUploader onDomainsSubmit={handleDomainsSubmit} />
            )}

            {user && (
              <div className="mt-6 text-sm text-slate-600 flex items-center justify-between">
                <span>Signed in as {user.email}</span>
                <button
                  onClick={() => {
                    console.log('🚪 User signing out...');
                    supabase.auth.signOut();
                  }}
                  className="text-sm text-slate-700 hover:text-slate-900 underline"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-white/70 rounded-lg text-xs border border-slate-200">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
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
