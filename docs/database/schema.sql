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

-- Enable RLS (Row Level Security)
alter table jobs enable row level security;
alter table analysis enable row level security;

-- Create policies
create policy "Users can only see their own jobs" on jobs
  for all using (auth.uid() = user_id);

create policy "Users can only see analysis for their jobs" on analysis
  for all using (
    auth.uid() = (select user_id from jobs where jobs.id = analysis.job_id)
  );

-- Create indexes for better performance
create index jobs_user_id_idx on jobs(user_id);
create index jobs_status_idx on jobs(status);
create index jobs_created_at_idx on jobs(created_at);

-- Enable real-time subscriptions
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table analysis; 