import OpenAI from 'openai';

// OpenAI Responses API wrapper
export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateThinkingResponse(domains: string[]): Promise<any> {
    try {
      const prompt = this.buildThinkingPrompt(domains);
      
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o instead of o3-pro as it's more readily available
        messages: [
          {
            role: "system",
            content: "You are DomainStrategist v2 – an AI consultant who analyses domains and designs startup ideas. Return only valid JSON; no commentary, no Markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate JSON
      const analysis = JSON.parse(response);
      return analysis;
    } catch (error) {
      console.error('OpenAI API error:', error);
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
• themes [3 objects] { name, colors [2-4 hex], fonts, tone, layout }

4. Output exactly:
{
  "domains":[{domain:"...", seo_score:X, brand_score:Y, ideas:[...]}],
  "top_domains":["","",""]
}

5. Non-top domains: supply only domain + scores (omit ideas[]).
6. JSON only, no stray text. Valid hex colors. Exactly 3 ideas and 3 themes per idea.
############################`;
  }
} 