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
    
    // Try full generation first
    try {
      return await this.generateFullPrototype(spec);
    } catch (error) {
      console.error('Full generation failed, trying split generation:', error);
      return await this.generateSplitPrototype(spec);
    }
  }

  private async generateFullPrototype(spec: ThemeSpec): Promise<Bundle> {
    const prompt = this.buildPrompt(spec);
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 15000, // Reduced from 20k to reduce truncation risk
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

      // Parse the JSON response with robust handling
      let bundle: Bundle;
      try {
        let text = content.text.trim();
        
        // Handle markdown code blocks (```json ... ```)
        if (text.includes('```json')) {
          const start = text.indexOf('```json') + 7; // Skip "```json"
          const end = text.indexOf('```', start);
          if (end !== -1) {
            text = text.substring(start, end).trim();
          }
        }
        
        // Find the JSON object boundaries
        const firstBrace = text.indexOf('{');
        
        if (firstBrace === -1) {
          throw new Error('No JSON found in response');
        }
        
        // Find the matching closing brace by counting braces
        let braceCount = 0;
        let lastBrace = -1;
        let maxDepth = 0;
        console.log(`Starting brace count from position ${firstBrace} of ${text.length} total chars`);
        
        for (let i = firstBrace; i < text.length; i++) {
          if (text[i] === '{') {
            braceCount++;
            maxDepth = Math.max(maxDepth, braceCount);
            if (i < firstBrace + 100 || i > text.length - 100) {
              console.log(`Position ${i}: Found { - count now ${braceCount}`);
            }
          }
          if (text[i] === '}') {
            braceCount--;
            if (i < firstBrace + 100 || i > text.length - 100) {
              console.log(`Position ${i}: Found } - count now ${braceCount}`);
            }
            if (braceCount === 0) {
              lastBrace = i;
              console.log(`JSON ends at position ${i} after ${i - firstBrace} characters`);
              break;
            }
          }
        }
        
        console.log(`Brace counting complete. Final count: ${braceCount}, Max depth: ${maxDepth}`);
        
        if (lastBrace === -1) {
          console.log(`TRUNCATION DETECTED: Response appears truncated at position ${text.length}`);
          console.log(`Final brace count: ${braceCount} (should be 0)`);
          console.log(`Last 200 chars of response: "${text.substring(Math.max(0, text.length - 200))}"`);
          throw new Error('Malformed JSON - no matching closing brace (likely truncated response)');
        }
        
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        bundle = JSON.parse(jsonStr);
        
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Full response length:', content.text.length);
        console.error('Response preview (first 3000 chars):', content.text.substring(0, 3000));
        console.error('Response ending (last 1000 chars):', content.text.substring(Math.max(0, content.text.length - 1000)));
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`Failed to parse JSON response: ${errorMessage}`);
      }
      
      // Validate bundle structure
      if (!bundle.files || typeof bundle.files !== 'object') {
        throw new Error('Invalid bundle structure - missing files object');
      }

      // Ensure required files exist (both with and without leading slash for compatibility)
      const requiredFiles = ['index.html', 'signup.html', 'onboarding.html', 'dashboard.html', 'assets/style.css', 'assets/app.js', 'sw.js', 'manifest.json'];
      const fileKeys = Object.keys(bundle.files);
      const missingFiles = requiredFiles.filter(file => 
        !fileKeys.includes(file) && !fileKeys.includes('/' + file)
      );
      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
      }

      console.log(`✅ Generated prototype with ${Object.keys(bundle.files).length} files`);
      return bundle;

    } catch (error) {
      console.error('❌ Error generating prototype:', error);
      throw error;
    }
  }



  private buildPrompt(spec: ThemeSpec): string {
    return `You are SiteBuilder v2 (MVP2.md). Convert structured specifications into conversion-optimized landing pages that prioritize visual polish and user engagement over byte budget.

## ThemeSpec Input:
${JSON.stringify(spec, null, 2)}

## CRITICAL JSON OUTPUT REQUIREMENTS:
1. Use markdown code block format: \`\`\`json ... \`\`\`
2. ALL strings must be properly escaped (use \\" for quotes, \\n for newlines)
3. NO trailing commas anywhere in the JSON
4. Ensure ALL braces, brackets, and quotes are properly closed
5. Test your JSON mentally before outputting

## Required JSON Schema:
{
  "files": {
    "/index.html": "complete HTML string here",
    "/signup.html": "complete HTML string here", 
    "/onboarding.html": "complete HTML string here",
    "/dashboard.html": "complete HTML string here",
    "/assets/style.css": "complete CSS string here",
    "/assets/app.js": "complete JS string here",
    "/sw.js": "complete service worker JS string here",
    "/manifest.json": "complete manifest JSON string here"
  }
}

### MVP2.md CONVERSION-FIRST REQUIREMENTS

1. **Conversion-first design priority:**
   - Hero section with Unsplash background: Extract keywords from theme.hero_visual and use \`https://source.unsplash.com/random/1600x900?{keywords}\`
   - Hero section must cover ≥ 60% viewport height @ 1440px with background-size: cover
   - USP headline ≤ 12 words, emotionally compelling
   - CTA buttons must use EXACT text from theme.primary_cta (not "Get Started")
   - Testimonials section using theme.social_proof array with circular avatar SVGs
   - FAQ accordion using theme.faq_entries array with expand/collapse functionality

2. **Enhanced visual design:**
   - You may import ONE Google Font with \`font-display: swap\` via preconnect
   - Rich color palette using all theme.colors with gradients and depth
   - Sophisticated typography hierarchy (5+ font sizes)
   - Professional spacing system (8px, 16px, 24px, 32px, 48px, 64px)
   - Modern CSS: Grid layouts, Flexbox, smooth transitions, hover effects

3. **MANDATORY Content integration:**
   - TESTIMONIALS: Create a section that loops through theme.social_proof array, each with circular avatar SVG
   - FAQ ACCORDION: Create an accordion that loops through theme.faq_entries array with JavaScript toggle
   - HERO BACKGROUND: Use theme.hero_visual to generate Unsplash URL (extract 1-2 keywords from the description)
   - PRIMARY CTA: Use theme.primary_cta text for ALL call-to-action buttons
   - Include 6+ detailed feature descriptions beyond core_features
   - Add realistic company details and trust signals

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

## FINAL REMINDER: JSON OUTPUT IN MARKDOWN
- Use \`\`\`json to start the code block
- End with \`\`\` to close the code block
- Properly escape all quotes and newlines within the JSON
- Validate JSON structure before output

BEGIN MARKDOWN JSON OUTPUT NOW:`;
  }

  private async generateSplitPrototype(spec: ThemeSpec): Promise<Bundle> {
    console.log('🔄 Starting split generation approach...');
    
    const bundle: Bundle = { files: {} };
    
    // Generate HTML files first
    const htmlFiles = ['index.html', 'signup.html', 'onboarding.html', 'dashboard.html'];
    for (const file of htmlFiles) {
      console.log(`📄 Generating ${file}...`);
      const content = await this.generateSingleFile(spec, file, 'html');
      bundle.files[`/${file}`] = content;
    }
    
    // Generate CSS
    console.log('🎨 Generating CSS...');
    const css = await this.generateSingleFile(spec, 'style.css', 'css');
    bundle.files['/assets/style.css'] = css;
    
    // Generate JS
    console.log('⚡ Generating JavaScript...');
    const js = await this.generateSingleFile(spec, 'app.js', 'js');
    bundle.files['/assets/app.js'] = js;
    
    // Generate service worker
    console.log('⚙️ Generating service worker...');
    const sw = await this.generateSingleFile(spec, 'sw.js', 'sw');
    bundle.files['/sw.js'] = sw;
    
    // Generate manifest
    console.log('📋 Generating manifest...');
    const manifest = await this.generateSingleFile(spec, 'manifest.json', 'manifest');
    bundle.files['/manifest.json'] = manifest;
    
    console.log('✅ Split generation complete');
    return bundle;
  }

  private async generateSingleFile(spec: ThemeSpec, filename: string, type: string): Promise<string> {
    const prompt = this.buildSingleFilePrompt(spec, filename, type);
    
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000, // Smaller limit for individual files
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

    // Extract content from markdown code block
    let text = content.text.trim();
    if (text.includes('```')) {
      const start = text.indexOf('```') + 3;
      // Skip language identifier (html, css, js, json)
      const newlineAfterLang = text.indexOf('\n', start);
      const codeStart = newlineAfterLang + 1;
      const end = text.lastIndexOf('```');
      if (end > codeStart) {
        text = text.substring(codeStart, end).trim();
      }
    }
    
    return text;
  }

  private buildSingleFilePrompt(spec: ThemeSpec, filename: string, type: string): string {
    const baseContext = `You are SiteBuilder v2 generating ${filename} for ${spec.domain}.

## Theme Context:
- Domain: ${spec.domain}
- Concept: ${spec.startup_concept}
- Target: ${spec.target_persona}
- Value: ${spec.value_prop}
- Theme: ${spec.theme.name}
- Colors: ${spec.theme.colors.join(', ')}
- Fonts: ${spec.theme.fonts}
- Hero Visual: ${spec.theme.hero_visual}
- Primary CTA: ${spec.theme.primary_cta}

`;

    const filePrompts: { [key: string]: string } = {
      'index.html': `Generate the landing page HTML with:
- Hero section with Unsplash background using: https://source.unsplash.com/random/1600x900?${spec.theme.hero_visual.split(' ').slice(0, 2).join(',')}
- USP headline using the value proposition
- Features section showcasing: ${spec.core_features.join(', ')}
- Testimonials section with these quotes: ${spec.theme.social_proof.join(' | ')}
- FAQ section with these Q&As: ${spec.theme.faq_entries.map(f => `Q: ${f.q} A: ${f.a}`).join(' | ')}
- CTA buttons using: "${spec.theme.primary_cta}"
Output ONLY the complete HTML wrapped in \`\`\`html ... \`\`\``,
      
      'signup.html': `Generate the signup page HTML with form for email/password registration.
Include the same branding and navigation as index.html.
Output ONLY the complete HTML wrapped in \`\`\`html ... \`\`\``,
      
      'onboarding.html': `Generate the onboarding page HTML for new users.
Include progress steps and welcome messaging.
Output ONLY the complete HTML wrapped in \`\`\`html ... \`\`\``,
      
      'dashboard.html': `Generate the dashboard page HTML showing the main product interface.
Include navigation and placeholder for main functionality.
Output ONLY the complete HTML wrapped in \`\`\`html ... \`\`\``,
      
      'style.css': `Generate the CSS with:
- Google Font import for: ${spec.theme.fonts}
- Color scheme using: ${spec.theme.colors.join(', ')}
- Hero section styles with 60%+ viewport height
- Rich visual hierarchy with 5+ font sizes
- Professional spacing system
- Mobile responsive design
Output ONLY the complete CSS wrapped in \`\`\`css ... \`\`\``,
      
      'app.js': `Generate the JavaScript with:
- FAQ accordion functionality
- Mobile menu toggle
- Form validation
- PWA service worker registration
Output ONLY the complete JS wrapped in \`\`\`javascript ... \`\`\``,
      
      'sw.js': `Generate a service worker for offline functionality and caching.
Output ONLY the complete JS wrapped in \`\`\`javascript ... \`\`\``,
      
      'manifest.json': `Generate the PWA manifest with app name, theme colors, and icons.
Use theme color: ${spec.theme.colors[0]}
Output ONLY the complete JSON wrapped in \`\`\`json ... \`\`\``,
    };

    return baseContext + (filePrompts[filename] || `Generate ${filename} for the theme.`);
  }
}

// Convenience function for direct usage
export async function generatePrototype(spec: ThemeSpec, apiKey: string): Promise<Bundle> {
  const agent = new BuilderAgent(apiKey);
  return agent.generatePrototype(spec);
} 