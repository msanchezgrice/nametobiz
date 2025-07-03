import Anthropic from '@anthropic-ai/sdk';

// Anthropic Claude API wrapper
export class AnthropicClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateThinkingResponse(domains: string[]): Promise<any> {
    try {
      const prompt = this.buildThinkingPrompt(domains);
      
      const message = await this.client.messages.create({
        model: "claude-opus-4-20250514", // Using Claude Opus 4 for thinking agent
        max_tokens: 20000, // Increased for richer content
        temperature: 0.7,
        system: "You are DomainStrategist v2 – an AI consultant who analyses domains and designs conversion-optimized startup ideas. Return only valid JSON; no commentary, no Markdown.",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const response = message.content[0];
      if (response.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Parse and validate JSON
      const analysis = JSON.parse(response.text);
      return analysis;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  private buildThinkingPrompt(domains: string[]): string {
    const domainList = domains.join('\n');
    
    return `domains:
${domainList}

############################
TASK
1. For every domain:
   1.1 Assign "seo_score" (0-10) and "brand_score" (0-10) based on domain quality.
2. Select the top 3 domains (highest combined potential).
3. For each selected domain, create 3 fundamentally different startup ideas.

Each idea must include:
• idea_rank (1 = strongest)
• idea_name
• target_persona
• value_prop
• monetization
• gtm
• core_features [exactly 3]
• themes [3 objects] with CONVERSION-FOCUSED fields:

THEME SCHEMA (MVP2.md enhanced):
{
  "name": "Theme Name",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "fonts": "Font specification",
  "tone": "Brand tone", 
  "layout": "Layout description",
  "hero_visual": "Keywords for Unsplash background image",
  "social_proof": [
    "First testimonial quote with benefit - Name T., Title",
    "Second testimonial quote with result - Name S., Company"
  ],
  "faq_entries": [
    {"q": "What is this product?", "a": "Clear answer about the product"},
    {"q": "How does pricing work?", "a": "Simple pricing explanation"}
  ],
  "primary_cta": "Call-to-action button text"
}

4. Output exactly:
{
  "domains":[{domain:"...", seo_score:X, brand_score:Y, ideas:[...]}],
  "top_domains":["","",""]
}

5. Non-top domains: supply only domain + scores (omit ideas[]).
6. CRITICAL: Output ONLY valid JSON - no markdown, no comments, no extra text.
7. CRITICAL: Use simple quotes in strings, avoid special characters that break JSON parsing.
8. CRITICAL: hero_visual must be descriptive for Unsplash (e.g., "Wide desert landscape with modern technology overlay", "Professional office space with collaborative team").
9. CRITICAL: social_proof testimonials must include specific, believable benefits and realistic names/titles.
10. CRITICAL: FAQ entries must address real user concerns for the industry.
11. CRITICAL: primary_cta must be action-oriented and conversion-focused.
############################`;
  }
} 