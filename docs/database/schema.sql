-- Jobs table for tracking domain analysis and prototype generation
create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  domains text[] not null,
  status text default 'pending' not null,
  email_sent boolean default false,
  created_at timestamptz default now()
);

-- Analysis table for storing thinking agent results  
create table analysis (
  job_id uuid primary key references jobs,
  spec jsonb not null,
  created_at timestamptz default now()
);

-- Bundles table for tracking individual generated prototypes
create table bundles (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs not null,
  domain text not null,
  theme_name text not null,
  bundle_data jsonb not null,
  bundle_key text not null, -- R2 storage key
  preview_url text not null, -- Cloudflare Worker URL
  created_at timestamptz default now()
);

-- MVP2.md Phase 7b: Edit Jobs table for in-place editing
create table edit_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  prototype_id text not null, -- References the bundle/prototype being edited
  path text not null, -- File path within the prototype (e.g., '/index.html')
  html_snippet text not null, -- Original HTML snippet to be edited
  instruction text not null, -- User's edit instruction
  revised_html text, -- AI-generated revised HTML (set when completed)
  status text default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message text, -- Error details if status is 'failed'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS (Row Level Security)
alter table jobs enable row level security;
alter table analysis enable row level security;
alter table bundles enable row level security;
alter table edit_jobs enable row level security;

-- Create policies
create policy "Users can only see their own jobs" on jobs
  for all using (auth.uid() = user_id);

create policy "Users can only see analysis for their jobs" on analysis
  for all using (
    auth.uid() = (select user_id from jobs where jobs.id = analysis.job_id)
  );

create policy "Users can only see bundles for their jobs" on bundles
  for all using (
    auth.uid() = (select user_id from jobs where jobs.id = bundles.job_id)
  );

-- MVP2.md Phase 7b: Edit jobs policies
create policy "Users can view their own edit jobs" on edit_jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own edit jobs" on edit_jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own edit jobs" on edit_jobs
  for update using (auth.uid() = user_id);

create policy "Service role can manage edit jobs" on edit_jobs
  for all using (current_setting('role') = 'service_role');

-- Create indexes for better performance
create index jobs_user_id_idx on jobs(user_id);
create index jobs_status_idx on jobs(status);
create index jobs_created_at_idx on jobs(created_at);
create index bundles_job_id_idx on bundles(job_id);

-- MVP2.md Phase 7b: Indexes for edit jobs
create index idx_edit_jobs_user_id on edit_jobs(user_id);
create index idx_edit_jobs_status on edit_jobs(status);
create index idx_edit_jobs_prototype_id on edit_jobs(prototype_id);

-- Enable real-time subscriptions
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table analysis;
alter publication supabase_realtime add table bundles;
alter publication supabase_realtime add table edit_jobs; 

-- Functions for updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for edit_jobs updated_at
create trigger update_edit_jobs_updated_at
  before update on edit_jobs
  for each row
  execute function update_updated_at_column(); 