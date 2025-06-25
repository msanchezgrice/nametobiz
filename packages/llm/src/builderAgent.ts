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
    hero_visual: string;
    social_proof: string[];
    faq_entries: Array<{ q: string; a: string }>;
    primary_cta: string;
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
        max_tokens: 12000,
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
    return `You are SiteBuilder v2 (MVP2.md). Convert structured specifications into conversion-optimized landing pages that prioritize visual polish and user engagement over byte budget. Output a single JSON bundle exactly matching the schema.

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

### MVP2.md CONVERSION-FIRST REQUIREMENTS

1. **Conversion-first design priority:**
   - Render USP headline, hero section, benefits grid, testimonial block, FAQ accordion, single CTA
   - Use theme.hero_visual for hero background via Unsplash: \`https://source.unsplash.com/1600x900?{keyword}\`
   - Hero section must cover ≥ 60% viewport height @ 1440px
   - USP headline ≤ 12 words, emotionally compelling
   - CTA buttons must use exact theme.primary_cta text

2. **Enhanced visual design:**
   - You may import ONE Google Font with \`font-display: swap\` via preconnect
   - Rich color palette using all theme.colors with gradients and depth
   - Sophisticated typography hierarchy (5+ font sizes)
   - Professional spacing system (8px, 16px, 24px, 32px, 48px, 64px)
   - Modern CSS: Grid layouts, Flexbox, smooth transitions, hover effects

3. **Content integration:**
   - Use theme.social_proof testimonials with avatar SVG circles
   - Implement theme.faq_entries as interactive accordion
   - Include 6+ detailed feature descriptions (not just core_features)
   - Add realistic company details, team info, and trust signals

4. **Design > byte-budget:**
   - Focus on visual appeal over file size constraints
   - Use rich gradients, shadows, and visual depth
   - Inline SVG icons with multiple variations
   - Beautiful micro-interactions and animations

5. **Technical requirements:**
   - PWA compliant with enhanced manifest.json
   - Service worker with smart caching strategies
   - Mobile-responsive with touch-optimized interactions
   - Accessibility compliance (ARIA labels, semantic HTML)
   - CLS < 0.1 via font-display: swap

### CRITICAL: Use Relative Paths Only
All links and assets MUST use relative paths (no leading slash):
- Navigation: href="signup.html" NOT href="/signup.html"
- CSS: href="assets/style.css" NOT href="/assets/style.css"  
- JS: src="assets/app.js" NOT src="/assets/app.js"
- Service worker registration: navigator.serviceWorker.register("sw.js")

### VISUAL QA CHECKLIST
✅ Hero covers ≥ 60% viewport height with Unsplash background
✅ USP headline ≤ 12 words, compelling and clear
✅ CTA buttons use exact theme.primary_cta text
✅ Testimonials render with names, titles, and avatar circles
✅ FAQ accordion is functional and well-styled
✅ Google Font loads with font-display: swap
✅ Rich visual hierarchy with 5+ font sizes
✅ Professional spacing and modern design patterns

Focus on creating a conversion-optimized landing page that looks professional enough to command premium pricing. Prioritize visual appeal, user engagement, and authentic content over technical constraints.

Begin.`;
  }
}

// Convenience function for direct usage
export async function generatePrototype(spec: ThemeSpec, apiKey: string): Promise<Bundle> {
  const agent = new BuilderAgent(apiKey);
  return agent.generatePrototype(spec);
} 