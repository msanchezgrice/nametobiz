import { createClient } from '@supabase/supabase-js';

export interface Job {
  id: string;
  user_id: string;
  domains: string[];
  status: string;
  email_sent: boolean;
  created_at: string;
}

export interface Analysis {
  job_id: string;
  spec: any;
  created_at: string;
}

export class SupabaseClient {
  private client;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Public method to access the client for custom queries
  public getClient() {
    return this.client;
  }

  async getNextPendingJob(): Promise<Job | null> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    const { error } = await this.client
      .from('jobs')
      .update({ status })
      .eq('id', jobId);

    if (error) {
      throw error;
    }
  }

  async saveAnalysis(jobId: string, analysis: any): Promise<void> {
    const { error } = await this.client
      .from('analysis')
      .insert({
        job_id: jobId,
        spec: analysis
      });

    if (error) {
      throw error;
    }
  }

  async getAnalysis(jobId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('analysis')
      .select('spec')
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data?.spec;
  }
} 