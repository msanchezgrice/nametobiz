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
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleDomainsSubmit = async (domains: string[]) => {
    try {
      const response = await fetch('/api/start-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit domains');
      }

      // Redirect to job status page
      router.push(`/job/${data.jobId}`);
    } catch (error) {
      console.error('Error submitting domains:', error);
      throw error;
    }
  };

  const handleAuthenticated = () => {
    // This will be called when user successfully authenticates
    // The useEffect above will handle updating the user state
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              onClick={() => supabase.auth.signOut()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
