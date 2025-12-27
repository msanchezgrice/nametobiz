'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EmailGateProps {
  onAuthenticated: () => void;
}

export default function EmailGate({ onAuthenticated }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const supabase = createClientComponentClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the login link!');
        onAuthenticated();
      }
    } catch (err) {
      console.error('Error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white/90 rounded-3xl border border-slate-200 shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Get started
        </h2>
        <p className="text-slate-600">
          Enter your email to continue with domain analysis.
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-slate-50/80"
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <p className="text-emerald-600 text-sm">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          data-ph-event="signup_click"
          className="w-full bg-slate-900 text-white py-3 px-6 rounded-full hover:bg-slate-800 focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          We&apos;ll send you a secure login link via email. No passwords required.
        </p>
      </div>
    </div>
  );
}
