-- Create session_tests table
create table public.session_tests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  test_type text not null,
  difficulty integer not null check (difficulty >= 0 and difficulty <= 20),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for session_tests
alter table public.session_tests enable row level security;

-- Create policies for session_tests
create policy "Anyone can read session_tests"
  on public.session_tests for select
  using (true);

create policy "Masters can insert session_tests"
  on public.session_tests for insert
  with check (true); -- In a real app, verify the user is the GM of the session

create policy "Masters can update session_tests"
  on public.session_tests for update
  using (true);

-- Create session_test_results table
create table public.session_test_results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.session_tests(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  result_value integer,
  is_approved boolean,
  status text not null default 'pending' check (status in ('pending', 'submitted')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for session_test_results
alter table public.session_test_results enable row level security;

-- Create policies for session_test_results
create policy "Anyone can read session_test_results"
  on public.session_test_results for select
  using (true);

create policy "Masters can insert session_test_results"
  on public.session_test_results for insert
  with check (true);

create policy "Players can update their own results"
  on public.session_test_results for update
  using (auth.uid() = player_id);

-- Enable Realtime for the new tables
alter publication supabase_realtime add table public.session_tests;
alter publication supabase_realtime add table public.session_test_results;

