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
        model: "claude-3-5-sonnet-20241022", // Using Claude 3.5 Sonnet (latest)
        max_tokens: 6000, // Increased for richer content
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
  "hero_visual": "Precise art direction for hero background image (for Unsplash API)",
  "social_proof": [
    "\"Testimonial quote 1 with specific benefit.\" - Name T., Title",
    "\"Testimonial quote 2 with measurable result.\" - Name S., Company"
  ],
  "faq_entries": [
    {"q": "Common question about the product?", "a": "Clear, detailed answer that builds trust."},
    {"q": "Another frequent concern?", "a": "Reassuring response with specifics."}
  ],
  "primary_cta": "Exact call-to-action button text"
}

4. Output exactly:
{
  "domains":[{domain:"...", seo_score:X, brand_score:Y, ideas:[...]}],
  "top_domains":["","",""]
}

5. Non-top domains: supply only domain + scores (omit ideas[]).
6. JSON only, no stray text. Valid hex colors. Exactly 3 ideas and 3 themes per idea.
7. CRITICAL: hero_visual must be descriptive for Unsplash (e.g., "Wide desert landscape with modern technology overlay", "Professional office space with collaborative team").
8. CRITICAL: social_proof testimonials must include specific, believable benefits and realistic names/titles.
9. CRITICAL: FAQ entries must address real user concerns for the industry.
10. CRITICAL: primary_cta must be action-oriented and conversion-focused.
############################`;
  }
} 