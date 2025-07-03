'use client';

import { useState, useRef, useEffect } from 'react';

interface EditOverlayProps {
  prototypeId: string;
  iframeSrc: string;
}

interface EditRequest {
  elementHtml: string;
  instruction: string;
  position: { x: number; y: number };
}

export default function EditOverlay({ prototypeId, iframeSrc }: EditOverlayProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editRequest, setEditRequest] = useState<EditRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setEditRequest(null);
  };

  // Handle iframe load and setup edit functionality
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isEditMode) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) return;

        // Add hover effects and right-click handling
        const elements = iframeDoc.querySelectorAll('*');
        elements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          
          // Add hover effect
          htmlElement.addEventListener('mouseenter', () => {
            htmlElement.style.outline = '2px solid #0ea5e9';
            htmlElement.style.outlineOffset = '2px';
          });

          htmlElement.addEventListener('mouseleave', () => {
            htmlElement.style.outline = '';
            htmlElement.style.outlineOffset = '';
          });

          // Add right-click context menu
          htmlElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const rect = htmlElement.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();
            
            setEditRequest({
              elementHtml: htmlElement.outerHTML,
              instruction: '', // Will be filled by user
              position: {
                x: iframeRect.left + rect.left,
                y: iframeRect.top + rect.top
              }
            });
          });
        });

      } catch (error) {
        console.error('Error setting up edit mode:', error);
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [isEditMode]);

  // Process edit request
  const processEdit = async (instruction: string) => {
    if (!editRequest) return;

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/edit-snippet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prototypeId,
          path: '/index.html', // Assuming we're editing the main page
          html: editRequest.elementHtml,
          instruction
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Poll for completion (in a real implementation, you'd use WebSocket or SSE)
        setTimeout(() => {
          // Reload iframe to show changes
          if (iframeRef.current) {
            iframeRef.current.src = iframeSrc;
          }
          setEditRequest(null);
          setIsProcessing(false);
        }, 3000);
      } else {
        console.error('Edit failed:', result.error);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing edit:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Edit Mode Toggle */}
      <button
        onClick={toggleEditMode}
        className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-lg font-medium transition-colors ${
          isEditMode 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isEditMode ? '🚫 Exit Edit' : '✏️ Edit Mode'}
      </button>

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="absolute top-16 right-4 z-10 bg-black/80 text-white p-3 rounded-lg text-sm max-w-xs">
          <p className="font-medium mb-1">Edit Mode Active</p>
          <p>Hover over elements to highlight them, then right-click to edit.</p>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Prototype Preview"
      />

      {/* Edit Dialog */}
      {editRequest && (
        <div 
          className="fixed z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80"
          style={{
            left: editRequest.position.x,
            top: editRequest.position.y
          }}
        >
          <h3 className="font-medium mb-2">Edit Element</h3>
          <p className="text-sm text-gray-600 mb-3">
            Describe what you want to change:
          </p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const instruction = formData.get('instruction') as string;
              if (instruction.trim()) {
                processEdit(instruction.trim());
              }
            }}
          >
            <textarea
              name="instruction"
              placeholder="e.g., Make the background blue, change text to..."
              className="w-full border border-gray-300 rounded p-2 text-sm mb-3"
              rows={3}
              disabled={isProcessing}
            />
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {isProcessing ? '🔄 Processing...' : '✨ Apply Edit'}
              </button>
              <button
                type="button"
                onClick={() => setEditRequest(null)}
                className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 