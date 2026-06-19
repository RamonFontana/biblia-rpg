-- Create types
create type public.combat_status as enum ('setup', 'active', 'paused', 'finished');
create type public.combat_entity_type as enum ('player', 'npc', 'enemy');

-- Create combats table
create table public.combats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  status public.combat_status not null default 'setup',
  current_turn_index integer not null default 0,
  round_number integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create combat_participants table
create table public.combat_participants (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references public.combats(id) on delete cascade,
  entity_id uuid not null,
  entity_type public.combat_entity_type not null,
  initiative integer not null default 0,
  hp_current integer not null default 0,
  conditions jsonb not null default '[]'::jsonb,
  is_surprised boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.combats enable row level security;
alter table public.combat_participants enable row level security;

-- Policies for combats
create policy "Users can view combats for their sessions"
  on public.combats for select
  using (public.is_session_gm(session_id) or public.is_session_participant(session_id));

create policy "GMs can manage combats"
  on public.combats for all
  using (public.is_session_gm(session_id));

-- Policies for combat_participants
create policy "Users can view combat participants"
  on public.combat_participants for select
  using (
    exists (
      select 1 from public.combats c
      where c.id = combat_id
      and (public.is_session_gm(c.session_id) or public.is_session_participant(c.session_id))
    )
  );

create policy "GMs can manage combat participants"
  on public.combat_participants for all
  using (
    exists (
      select 1 from public.combats c
      where c.id = combat_id
      and public.is_session_gm(c.session_id)
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table public.combats;
alter publication supabase_realtime add table public.combat_participants;
