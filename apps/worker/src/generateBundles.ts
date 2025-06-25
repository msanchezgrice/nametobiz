import { SupabaseClient, Job } from '@nametobiz/db';
import { generatePrototype, ThemeSpec, Bundle } from '@nametobiz/llm';
import { sleep } from '@nametobiz/utils';
import { R2Client } from './r2Client';

export interface Analysis {
  domains: Array<{
    domain: string;
    seo_score: number;
    brand_score: number;
    ideas?: Array<{
      idea_rank: number;
      idea_name: string;
      target_persona: string;
      value_prop: string;
      monetization: string;
      gtm: string;
      core_features: string[];
      themes: Array<{
        name: string;
        colors: string[];
        fonts: string;
        tone: string;
        layout: string;
      }>;
    }>;
  }>;
  top_domains: string[];
}

export interface PrototypeBundle {
  jobId: string;
  domain: string;
  ideaName: string;
  themeName: string;
  bundle: Bundle;
  metadata: {
    generatedAt: string;
    bundleSize: number;
  };
}

export class BundleGenerator {
  private db: SupabaseClient;
  private anthropicKey: string;
  private r2Client: R2Client | null = null;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    anthropicKey: string,
    r2Config?: {
      accountId: string;
      accessKeyId: string;
      secretAccessKey: string;
    }
  ) {
    this.db = new SupabaseClient(supabaseUrl, supabaseKey);
    this.anthropicKey = anthropicKey;
    
    // Initialize R2 client if credentials provided
    if (r2Config) {
      this.r2Client = new R2Client(
        r2Config.accountId,
        r2Config.accessKeyId,
        r2Config.secretAccessKey
      );
    }
  }

  async generateBundlesForJob(job: Job): Promise<void> {
    console.log(`📦 Starting bundle generation for job ${job.id}`);

    try {
      // Update job status to indicate bundle generation started
      await this.db.updateJobStatus(job.id, 'generating_bundles');

      // Get analysis data
      const analysis = await this.db.getAnalysis(job.id);
      if (!analysis) {
        throw new Error('No analysis found for job');
      }

      const bundles: PrototypeBundle[] = [];

      // Process each top domain
      for (const topDomain of analysis.top_domains) {
        console.log(`🎯 Processing domain: ${topDomain}`);
        
        const domainData = analysis.domains.find((d: any) => d.domain === topDomain);
        if (!domainData?.ideas) {
          console.warn(`No ideas found for domain ${topDomain}`);
          continue;
        }

        // Get the first idea (idea_rank = 1)
        const firstIdea = domainData.ideas.find((idea: any) => idea.idea_rank === 1);
        if (!firstIdea) {
          console.warn(`No rank 1 idea found for domain ${topDomain}`);
          continue;
        }

        console.log(`💡 Building prototypes for idea: ${firstIdea.idea_name}`);

        // Generate prototype for each theme of the first idea
        for (const theme of firstIdea.themes) {
          try {
            console.log(`🎨 Generating theme: ${theme.name}`);
            
            const themeSpec: ThemeSpec = {
              domain: topDomain,
              target_persona: firstIdea.target_persona,
              value_prop: firstIdea.value_prop,
              startup_concept: `${firstIdea.idea_name}: ${firstIdea.value_prop}`,
              core_features: firstIdea.core_features,
              theme: theme
            };

            const bundle = await generatePrototype(themeSpec, this.anthropicKey);
            
            // Calculate bundle size
            const bundleSize = this.calculateBundleSize(bundle);
            console.log(`📊 Bundle size: ${bundleSize} bytes`);

            const prototypeBundle: PrototypeBundle = {
              jobId: job.id,
              domain: topDomain,
              ideaName: firstIdea.idea_name,
              themeName: theme.name,
              bundle: bundle,
              metadata: {
                generatedAt: new Date().toISOString(),
                bundleSize: bundleSize
              }
            };

            bundles.push(prototypeBundle);

            // Small delay between generations to avoid rate limits
            await sleep(2000);

          } catch (error) {
            console.error(`❌ Failed to generate theme ${theme.name} for ${topDomain}:`, error);
            // Continue with next theme instead of failing the whole job
          }
        }

        // Delay between domains
        await sleep(3000);
      }

      if (bundles.length === 0) {
        throw new Error('No bundles were generated successfully');
      }

      // Store bundles (for now we'll store them in Supabase, later we can move to R2)
      await this.storeBundles(bundles);

      // Update job status to complete
      await this.db.updateJobStatus(job.id, 'bundles_ready');

      console.log(`✅ Generated ${bundles.length} prototypes for job ${job.id}`);

    } catch (error) {
      console.error(`❌ Bundle generation failed for job ${job.id}:`, error);
      await this.db.updateJobStatus(job.id, 'bundle_generation_failed');
      throw error;
    }
  }

  private calculateBundleSize(bundle: Bundle): number {
    return Object.values(bundle.files)
      .reduce((total: number, content: string) => {
        return total + Buffer.byteLength(content, 'utf8');
      }, 0);
  }

  private async ensureBundlesTable(): Promise<void> {
    try {
      // Try to create the bundles table if it doesn't exist
      const { error } = await this.db.getClient().rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS bundles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            job_id uuid REFERENCES jobs NOT NULL,
            domain text NOT NULL,
            theme_name text NOT NULL,
            bundle_key text NOT NULL,
            preview_url text NOT NULL,
            created_at timestamptz DEFAULT now()
          );
        `
      });
      
      if (error) {
        console.log('Bundles table setup - RPC not available, table might already exist:', error.message);
      } else {
        console.log('✅ Bundles table ensured');
      }
    } catch (error) {
      console.log('Bundles table setup error (table might already exist):', (error as Error).message);
    }
  }

  private async storeBundles(bundles: PrototypeBundle[]): Promise<void> {
    console.log(`💾 Storing ${bundles.length} bundles in database and R2`);

    // Ensure bundles table exists
    await this.ensureBundlesTable();

    // Create bundles table entry for each bundle
    for (const bundle of bundles) {
      try {
        console.log(`🔄 Attempting to store bundle: ${bundle.domain}/${bundle.themeName}`);
        
        // Upload to R2 if available
        let r2Keys: string[] = [];
        if (this.r2Client) {
          console.log(`☁️ Uploading to R2: ${bundle.domain}/${bundle.themeName}`);
          r2Keys = await this.r2Client.uploadBundle(
            bundle.jobId,
            bundle.domain,
            bundle.themeName,
            bundle.bundle.files
          );
          console.log(`✅ R2 upload complete: ${r2Keys.length} files`);
        }

        // Create the bundle key for R2 storage
        const bundleKey = `bundles/${bundle.jobId}/${bundle.domain}/${bundle.themeName}`;
        
        // Create the preview URL for Cloudflare Worker
        const previewUrl = `https://nametobiz-static-delivery.doodad.workers.dev/site/${bundleKey}/index.html`;

        const insertData = {
          job_id: bundle.jobId,
          domain: bundle.domain,
          theme_name: bundle.themeName,
          bundle_key: bundleKey,
          preview_url: previewUrl
        };

        console.log(`📝 Insert data prepared for ${bundle.domain}/${bundle.themeName}`);

        const { data, error } = await this.db.getClient()
          .from('bundles')
          .insert(insertData)
          .select();

        if (error) {
          console.error(`❌ Database error storing bundle for ${bundle.domain}/${bundle.themeName}:`, error);
        } else {
          console.log(`✅ Stored bundle: ${bundle.domain}/${bundle.themeName}`, data ? `(ID: ${data[0]?.id})` : '');
        }
      } catch (error) {
        console.error(`❌ Exception storing bundle for ${bundle.domain}/${bundle.themeName}:`, error);
      }
    }
    
    console.log(`💾 Finished storing ${bundles.length} bundles`);
  }
}

export async function generateBundlesForJob(
  job: Job,
  supabaseUrl: string,
  supabaseKey: string,
  anthropicKey: string,
  r2Config?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
  }
): Promise<void> {
  const generator = new BundleGenerator(supabaseUrl, supabaseKey, anthropicKey, r2Config);
  return generator.generateBundlesForJob(job);
} 