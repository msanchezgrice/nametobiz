import { SupabaseClient, Job } from '@nametobiz/db';
import { OpenAIClient, AnthropicClient } from '@nametobiz/llm';
import { sleep } from '@nametobiz/utils';
import { generateBundlesForJob } from './generateBundles';

export class ThinkingAgent {
  private db: SupabaseClient;
  private openai: OpenAIClient;
  private anthropic: AnthropicClient;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string,
    anthropicKey: string
  ) {
    this.db = new SupabaseClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAIClient(openaiKey);
    this.anthropic = new AnthropicClient(anthropicKey);
  }

  async processJob(job: Job): Promise<void> {
    console.log(`Processing job ${job.id} with domains:`, job.domains);

    try {
      // Update job status to indicate processing started
      await this.db.updateJobStatus(job.id, 'processing');

      // Use Anthropic Claude (preferred)
      const analysis = await this.anthropic.generateThinkingResponse(job.domains);
      
      // Validate that we got a proper analysis
      if (!analysis || !analysis.domains || !analysis.top_domains) {
        throw new Error('Invalid analysis response from AI');
      }

      console.log(`Analysis complete for job ${job.id}:`, {
        domainsAnalyzed: analysis.domains?.length,
        topDomains: analysis.top_domains
      });

      // Save analysis to database
      await this.db.saveAnalysis(job.id, analysis);

      // Update job status to analysis complete
      await this.db.updateJobStatus(job.id, 'analysis_complete');

      console.log(`✅ Job ${job.id} analysis completed successfully`);

      // Now start bundle generation
      console.log(`🚀 Starting bundle generation for job ${job.id}`);
      
      // Prepare R2 configuration if available
      const r2Config = process.env.CF_ACCOUNT_ID && process.env.CF_R2_ACCESS_KEY_ID && process.env.CF_R2_SECRET_ACCESS_KEY ? {
        accountId: process.env.CF_ACCOUNT_ID,
        accessKeyId: process.env.CF_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY
      } : undefined;

      await generateBundlesForJob(
        job,
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        process.env.ANTHROPIC_KEY!,
        r2Config
      );

    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      
      // Mark job as failed
      await this.db.updateJobStatus(job.id, 'failed');
      
      // Re-throw for logging purposes
      throw error;
    }
  }
}

export async function runThinkingAgent(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_KEY;
  const anthropicKey = process.env.ANTHROPIC_KEY;

  // Debug logging
  console.log('Environment variables check:');
  console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'MISSING'); 
  console.log('OPENAI_KEY:', openaiKey ? 'SET' : 'MISSING');
  console.log('ANTHROPIC_KEY:', anthropicKey ? 'SET' : 'MISSING');

  if (!supabaseUrl || !supabaseKey || !openaiKey || !anthropicKey) {
    throw new Error('Missing required environment variables');
  }

  const agent = new ThinkingAgent(supabaseUrl, supabaseKey, openaiKey, anthropicKey);
  const db = new SupabaseClient(supabaseUrl, supabaseKey);

  console.log('🤖 Thinking Agent started, looking for pending jobs...');

  while (true) {
    try {
      const job = await db.getNextPendingJob();
      
      if (!job) {
        // No pending jobs, wait 5 seconds
        await sleep(5000);
        continue;
      }

      // Process the job
      await agent.processJob(job);
      
      // Small delay between jobs
      await sleep(1000);
      
    } catch (error) {
      console.error('Worker error:', error);
      
      // Wait longer on error to avoid rapid retries
      await sleep(10000);
    }
  }
} 