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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Enter Your Domains
      </h2>
      <p className="text-gray-600 mb-6">
        Enter up to 10 domain names, one per line. We&apos;ll analyze them and create prototypes for the top 3.
      </p>
      
      <div className="mb-4">
        <label htmlFor="domains" className="block text-sm font-medium text-gray-700 mb-2">
          Domains (one per line)
        </label>
        <textarea
          id="domains"
          value={domainsText}
          onChange={(e) => setDomainsText(e.target.value)}
          placeholder={`thinkingobjects.ai\nstartclosein.com\ninteractiveobjects.ai`}
          className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Future OCR upload field */}
      <div className="mb-6">
        <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-2">
          Screenshot (optional - for future OCR)
        </label>
        <input
          type="file"
          id="screenshot"
          accept="image/*"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          disabled={true}
        />
        <p className="text-xs text-gray-500 mt-1">OCR functionality coming soon</p>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Processing...' : 'Analyze Domains'}
      </button>
    </div>
  );
} 