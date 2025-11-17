-- Add user_id column to runs table
alter table public.runs add column user_id uuid references auth.users(id) on delete cascade;

-- Create index for user_id queries
create index idx_runs_user_id on public.runs (user_id);

-- Drop old policies
drop policy if exists "Anyone can update runs" on public.runs;
drop policy if exists "Anyone can create runs" on public.runs;

-- New policy: Anyone can create runs (user_id will be set automatically)
create policy "Anyone can create runs"
  on public.runs
  for insert
  with check (auth.uid() = user_id);

-- New policy: Only owner can update their runs
create policy "Users can update own runs"
  on public.runs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- New policy: Only owner can delete their runs
create policy "Users can delete own runs"
  on public.runs
  for delete
  using (auth.uid() = user_id);
