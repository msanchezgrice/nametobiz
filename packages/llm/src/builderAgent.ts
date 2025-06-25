import Anthropic from '@anthropic-ai/sdk';

export interface ThemeSpec {
  domain: string;
  target_persona: string;
  value_prop: string;
  startup_concept: string;
  core_features: string[];
  theme: {
    name: string;
    colors: string[];
    fonts: string;
    tone: string;
    layout: string;
  };
}

export interface Bundle {
  files: {
    [path: string]: string;
  };
}

export class BuilderAgent {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generatePrototype(spec: ThemeSpec): Promise<Bundle> {
    console.log(`🎨 Building prototype for ${spec.domain} - ${spec.theme.name} theme`);
    
    const prompt = this.buildPrompt(spec);
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      // Parse the JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const bundle: Bundle = JSON.parse(jsonMatch[0]);
      
      // Validate bundle structure
      if (!bundle.files || typeof bundle.files !== 'object') {
        throw new Error('Invalid bundle structure - missing files object');
      }

      // Ensure required files exist
      const requiredFiles = ['/index.html', '/assets/style.css', '/assets/app.js', '/sw.js', '/manifest.json'];
      for (const file of requiredFiles) {
        if (!bundle.files[file]) {
          throw new Error(`Missing required file: ${file}`);
        }
      }

      console.log(`✅ Generated prototype with ${Object.keys(bundle.files).length} files`);
      return bundle;

    } catch (error) {
      console.error('❌ Error generating prototype:', error);
      throw error;
    }
  }

  private buildPrompt(spec: ThemeSpec): string {
    return `You are SiteBuilder v1. Convert structured specifications into fully working static websites ready for instant preview. Output a single JSON bundle exactly matching the schema. Never include commentary, Markdown, or extra keys.

## ThemeSpec Input:
${JSON.stringify(spec, null, 2)}

## Deliverables
Return JSON:
{
  "files": {
    "/index.html": "...",
    "/signup.html": "...", 
    "/onboarding.html": "...",
    "/dashboard.html": "...",
    "/assets/style.css": "...",
    "/assets/app.js": "...",
    "/sw.js": "...",
    "/manifest.json": "..."
  }
}

### Hard requirements
1. Use theme colors, fonts, tone exactly as specified
2. Complete copy – persuasive marketing text that matches the value proposition
3. Interactive feel – working nav, form validation → /onboarding.html, carousel, dashboard toast
4. Enhanced PWA with advanced sw.js:
   - Precache all static assets (cache-first strategy)
   - Network-first for API calls
   - Offline fallback pages
   - Background sync for forms
   - Web App Manifest compatibility
   - Total bundle size <200 KB
5. No external assets – embed SVGs, gradients, fonts inline
6. Accessibility semantics + ARIA labels (score >90)
7. Exactly the listed file keys above
8. Mobile-responsive design (viewport meta, touch-friendly)
9. Professional, modern UI that matches the specified theme
10. Working JavaScript functionality (form validation, navigation, interactive elements)
11. Performance optimized (Lighthouse score >90):
    - Minified CSS/JS
    - Optimized images as inline SVGs
    - Preload critical resources
    - Async/defer non-critical scripts

### PWA Requirements
Generate complete PWA compliance:

**Web App Manifest (manifest.json):**
- Name, short_name, description matching the startup concept
- Theme color and background color from theme
- Display: "standalone" for app-like experience
- Start URL: "/"  
- Icons array with multiple sizes including 512x512 maskable icon
- Proper orientation and scope settings

**Enhanced Service Worker (sw.js):**
- Cache versioning with theme name
- Install event with precaching all resources
- Fetch event with cache-first strategy + network fallback
- Offline fallback to index.html for navigation requests
- skipWaiting() and clients.claim() for immediate activation
- Background sync for form submissions

**HTML Requirements:**
- Link to manifest.json in all HTML files
- Theme color meta tags
- Viewport meta tag with proper scaling
- No deprecated APIs (avoid document.write, deprecated jQuery methods)
- Proper error handling to avoid console errors
- Service worker registration with error handling

### CRITICAL: Use Relative Paths Only
All links and assets MUST use relative paths (no leading slash):
- Navigation: href="signup.html" NOT href="/signup.html"
- CSS: href="assets/style.css" NOT href="/assets/style.css"  
- JS: src="assets/app.js" NOT src="/assets/app.js"
- Service worker registration: navigator.serviceWorker.register("sw.js")

Focus on creating a compelling, interactive prototype that showcases the startup concept effectively using the specified theme colors, fonts, and tone. Ensure maximum performance and PWA compliance.

Begin.`;
  }
}

// Convenience function for direct usage
export async function generatePrototype(spec: ThemeSpec, apiKey: string): Promise<Bundle> {
  const agent = new BuilderAgent(apiKey);
  return agent.generatePrototype(spec);
} 