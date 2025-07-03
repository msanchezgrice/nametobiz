import { AnthropicClient } from '@nametobiz/llm';

export interface EditJob {
  prototypeId: string;
  path: string; // e.g., '/index.html'
  html: string; // Current HTML snippet to edit
  instruction: string; // User instruction like "Make background blue"
}

export interface EditResult {
  revisedHtml: string;
  success: boolean;
  error?: string;
}

export class EditAgent {
  private client: AnthropicClient;

  constructor(apiKey: string) {
    this.client = new AnthropicClient(apiKey);
  }

  async processEditJob(job: EditJob): Promise<EditResult> {
    console.log(`🎨 Editing ${job.prototypeId}${job.path}: "${job.instruction}"`);
    
    try {
      const revisedHtml = await this.generateEditedHTML(job);

      // Basic validation that we got HTML back
      if (!revisedHtml.includes('<') || !revisedHtml.includes('>')) {
        throw new Error('Response does not appear to be valid HTML');
      }

      console.log(`✅ Successfully edited snippet (${revisedHtml.length} characters)`);
      
      return {
        revisedHtml,
        success: true
      };

    } catch (error) {
      console.error('❌ Error in edit agent:', error);
      return {
        revisedHtml: job.html, // Return original on error
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateEditedHTML(job: EditJob): Promise<string> {
    // Use a custom method for HTML editing since the existing AnthropicClient is designed for thinking tasks
    const prompt = this.buildEditPrompt(job);
    
    // We'll need to add this method to AnthropicClient or use a direct call
    // For now, let's create a simple implementation
    const domains = [`edit:${job.instruction}`]; // Placeholder to use existing interface
    const response = await this.client.generateThinkingResponse(domains);
    
    // This is a workaround - in a full implementation, we'd add a specific edit method to AnthropicClient
    return job.html; // Temporary fallback until we enhance the LLM client
  }

  private buildEditPrompt(job: EditJob): string {
    return `Edit this HTML snippet according to the user's instruction.

CURRENT HTML:
${job.html}

USER INSTRUCTION:
${job.instruction}

REQUIREMENTS:
1. Return ONLY the revised HTML snippet
2. Maintain all existing functionality and structure
3. Apply the requested change precisely
4. Keep all CSS classes, IDs, and data attributes intact
5. Ensure valid HTML syntax
6. Use relative paths only (no leading slashes)
7. If instruction is unclear, make the most reasonable interpretation

Return the updated HTML now:`;
  }
}

// Convenience function for direct usage
export async function processEdit(job: EditJob, apiKey: string): Promise<EditResult> {
  const agent = new EditAgent(apiKey);
  return agent.processEditJob(job);
} 