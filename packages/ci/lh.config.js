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
        'categories:performance': ['warn', { minScore: 0.85 }], // Slightly lower for edge delivery
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'categories:pwa': ['warn', { minScore: 0.7 }], // PWA scoring can be tricky for prototypes
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}; 