'use client';

import { useState } from 'react';

interface DomainUploaderProps {
  onDomainsSubmit: (domains: string[]) => void;
}

export default function DomainUploader({ onDomainsSubmit }: DomainUploaderProps) {
  const [domainsText, setDomainsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    return domainRegex.test(domain.trim());
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors([]);

    const domains = domainsText
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    if (domains.length === 0) {
      setErrors(['Please enter at least one domain']);
      setIsSubmitting(false);
      return;
    }

    if (domains.length > 10) {
      setErrors(['Maximum 10 domains allowed']);
      setIsSubmitting(false);
      return;
    }

    const invalidDomains = domains.filter(domain => !validateDomain(domain));
    if (invalidDomains.length > 0) {
      setErrors([`Invalid domains: ${invalidDomains.join(', ')}`]);
      setIsSubmitting(false);
      return;
    }

    try {
      await onDomainsSubmit(domains);
    } catch (error) {
      console.error('Error submitting domains:', error);
      setErrors(['Failed to submit domains. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white/90 rounded-3xl border border-slate-200 shadow-lg">
      <h2 className="text-2xl font-semibold mb-2 text-slate-900">
        Enter your domains
      </h2>
      <p className="text-slate-600 mb-6">
        Add up to 10 domains, one per line. We&apos;ll analyze them and build prototypes for the top 3.
      </p>
      
      <div className="mb-4">
        <label htmlFor="domains" className="block text-sm font-medium text-slate-700 mb-2">
          Domains (one per line)
        </label>
        <textarea
          id="domains"
          value={domainsText}
          onChange={(e) => setDomainsText(e.target.value)}
          placeholder={`thinkingobjects.ai\nstartclosein.com\ninteractiveobjects.ai`}
          className="w-full h-44 p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none bg-slate-50/80"
          disabled={isSubmitting}
        />
      </div>

      {/* Future OCR upload field */}
      <div className="mb-6">
        <label htmlFor="screenshot" className="block text-sm font-medium text-slate-700 mb-2">
          Screenshot (optional - for future OCR)
        </label>
        <input
          type="file"
          id="screenshot"
          accept="image/*"
          className="w-full p-2 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:bg-slate-100"
          disabled={true}
        />
        <p className="text-xs text-slate-500 mt-1">OCR functionality coming soon</p>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl">
          {errors.map((error, index) => (
            <p key={index} className="text-rose-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        data-ph-event="analyze_domains"
        className="w-full bg-slate-900 text-white py-3 px-6 rounded-full hover:bg-slate-800 focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Processing...' : 'Analyze Domains'}
      </button>
    </div>
  );
}
