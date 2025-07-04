'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import PrototypeCard from '../../../components/PrototypeCard';

interface Job {
  id: string;
  domains: string[];
  status: string;
  email_sent: boolean;
  created_at: string;
}

interface Bundle {
  id: string;
  domain: string;
  theme_name: string;
  bundle_key: string;
  preview_url: string;
  created_at: string;
}

export default function JobPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job data
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', params.id)
          .single();

        if (jobError) {
          setError('Job not found');
          return;
        }

        setJob(jobData);

        // Fetch bundles for this job
        const { data: bundlesData, error: bundlesError } = await supabase
          .from('bundles')
          .select('*')
          .eq('job_id', params.id)
          .order('created_at', { ascending: true });

        if (bundlesError) {
          console.error('Error fetching bundles:', bundlesError);
        } else {
          setBundles(bundlesData || []);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load job');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();

      // Set up real-time subscriptions with better error handling
      const jobSubscription = supabase
        .channel(`job-updates-${params.id}`, {
          config: {
            broadcast: { self: true }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'jobs',
            filter: `id=eq.${params.id}`,
          },
          (payload) => {
            console.log('🔄 Job update received:', payload.new);
            setJob(payload.new as Job);
          }
        )
        .subscribe((status) => {
          console.log('📡 Job subscription status:', status);
        });

      const bundlesSubscription = supabase
        .channel(`bundle-updates-${params.id}`, {
          config: {
            broadcast: { self: true }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bundles',
            filter: `job_id=eq.${params.id}`,
          },
          (payload) => {
            console.log('🔄 Real-time bundle update:', payload.new);
            setBundles(prev => {
              // Prevent duplicates
              const exists = prev.find(b => b.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new as Bundle];
            });
          }
        )
        .subscribe((status) => {
          console.log('📡 Bundle subscription status:', status);
        });

      // Auto-refresh every 10 seconds as backup
      const refreshInterval = setInterval(async () => {
        console.log('🔄 Auto-refreshing bundle data...');
        const { data: bundlesData } = await supabase
          .from('bundles')
          .select('*')
          .eq('job_id', params.id)
          .order('created_at', { ascending: true });
        
        if (bundlesData) {
          setBundles(bundlesData);
        }

        // Also refresh job status
        const { data: jobData } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (jobData) {
          setJob(jobData);
        }
      }, 10000);

      return () => {
        supabase.removeChannel(jobSubscription);
        supabase.removeChannel(bundlesSubscription);
        clearInterval(refreshInterval);
      };
    }
  }, [params.id, supabase]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your domains are being analyzed...';
      case 'analysis_complete':
        return 'Analysis complete! Generating prototypes...';
      case 'generating_bundles':
        return 'Building interactive prototypes... This may take 5-10 minutes.';
      case 'bundles_ready':
        return 'Prototypes are ready!';
      default:
        return `Status: ${status}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'analysis_complete':
      case 'generating_bundles':
        return 'text-yellow-600';
      case 'bundles_ready':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Job Status
          </h1>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Domains Being Analyzed:
            </h2>
            <ul className="list-disc list-inside text-gray-600">
              {job.domains.map((domain, index) => (
                <li key={index}>{domain}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3">
              {(job.status === 'pending' || job.status === 'analysis_complete' || job.status === 'generating_bundles') ? (
                <div className="relative">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  {job.status === 'generating_bundles' && (
                    <div className="absolute -top-1 -right-1 animate-pulse">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className={`text-lg font-medium ${getStatusColor(job.status)}`}>
                {getStatusMessage(job.status)}
              </span>
            </div>
            
            {/* Progress indicator for generating bundles */}
            {job.status === 'generating_bundles' && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                                     <span>Generating {bundles.length > 0 ? `${bundles.length}/${job.domains.length * 3}` : `0/${job.domains.length * 3}`} prototypes...</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-2">
                   <div 
                     className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                     style={{ width: `${Math.max(5, (bundles.length / (job.domains.length * 3)) * 100)}%` }}
                   ></div>
                </div>
                {bundles.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Latest: {bundles[bundles.length - 1]?.domain} - {bundles[bundles.length - 1]?.theme_name}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>Job ID: {job.id}</p>
              <p>Created: {new Date(job.created_at).toLocaleString()}</p>
              {job.email_sent && <p>Notification email sent ✓</p>}
            </div>
            
            {job.status === 'generating_bundles' && (
              <button
                onClick={() => window.location.reload()}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors"
              >
                🔄 Refresh Progress
              </button>
            )}
          </div>

          {job.status === 'bundles_ready' && bundles.length === 0 && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 font-medium">
                🎉 Your prototypes are ready! Loading previews...
              </p>
            </div>
          )}

          {/* Prototype Grid */}
          {bundles.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🎨 Generated Prototypes ({bundles.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((bundle) => (
                  <PrototypeCard key={bundle.id} bundle={bundle} />
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700">
                  <strong>💡 Tip:</strong> Click any prototype to view it full-screen. 
                  These are complete, interactive websites that work offline!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 