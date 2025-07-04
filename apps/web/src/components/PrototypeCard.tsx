'use client';

import { useState } from 'react';
import EditOverlay from './EditOverlay';

interface PrototypeCardProps {
  bundle: {
    id: string;
    domain: string;
    theme_name: string;
    bundle_key: string;
    preview_url: string;
    created_at: string;
  };
}

export default function PrototypeCard({ bundle }: PrototypeCardProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleThumbnailClick = () => {
    setIsFullScreen(true);
    
    // Preload related pages for better navigation
    const baseUrl = bundle.preview_url.replace('/index.html', '');
    const pagesToPreload = ['/signup.html', '/onboarding.html', '/dashboard.html'];
    
    pagesToPreload.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = baseUrl + page;
      document.head.appendChild(link);
    });
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Thumbnail Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {bundle.domain}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {bundle.theme_name} Theme
          </p>
        </div>

        {/* Thumbnail Preview */}
        <div className="relative aspect-video bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm">Preview unavailable</p>
                <p className="text-xs text-gray-400 mt-1">URL: {bundle.preview_url}</p>
              </div>
            </div>
          ) : (
            <iframe
              src={bundle.preview_url}
              className="w-full h-full border-0 bg-white"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-pointer-lock"
              title={`${bundle.domain} - ${bundle.theme_name} preview`}
              style={{ 
                pointerEvents: 'none',
                transform: 'scale(0.7)',
                transformOrigin: 'top left',
                width: '143%',
                height: '143%',
                backgroundColor: 'white'
              }}
              loading="lazy"
            />
          )}
          
          {/* Click overlay */}
          <div 
            className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-20"
            onClick={handleThumbnailClick}
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>Created {new Date(bundle.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleThumbnailClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              🔍 Preview
            </button>
            <a
              href={bundle.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
            >
              🚀 Open Site
            </a>
            <button
              onClick={() => {
                const testUrl = bundle.preview_url.replace('index.html', 'signup.html');
                window.open(testUrl, '_blank');
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-2 rounded text-sm transition-colors"
              title="Test signup page navigation"
            >
              📝
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={handleCloseFullScreen}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full Screen with Edit Overlay */}
          <div className="w-full h-full max-w-6xl max-h-screen m-4 rounded-lg overflow-hidden">
            <EditOverlay 
              prototypeId={bundle.id}
              iframeSrc={bundle.preview_url}
            />
          </div>

          {/* Info Bar */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg px-4 py-2 shadow-lg">
            <div className="text-sm">
              <span className="font-semibold text-gray-900">{bundle.domain}</span>
              <span className="text-gray-600 ml-2">• {bundle.theme_name} Theme</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 