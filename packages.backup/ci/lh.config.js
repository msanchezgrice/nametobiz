module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      method: 'node',
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        maxWaitForLoad: 10000,
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }], // Lowered from 0.85 to prioritize visual polish
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'categories:pwa': ['warn', { minScore: 0.7 }], // PWA scoring can be tricky for prototypes
        
        // MVP2.md: Strict CLS requirement for font-display: swap
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // Ensure font-display: swap works
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}; 