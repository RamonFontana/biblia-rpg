-- Create game_sessions table
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  gm_id uuid not null references auth.users(id),
  status text not null check (status in ('active', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create session_enemies table
create table public.session_enemies (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  base_enemy_id text not null,
  name text not null,
  current_hp integer not null,
  max_hp integer not null,
  created_at timestamptz not null default now()
);

-- Create session_npcs table
create table public.session_npcs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  name text not null,
  description text,
  stats jsonb,
  created_at timestamptz not null default now()
);

-- Create session_participants table
create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  joined boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.game_sessions enable row level security;
alter table public.session_enemies enable row level security;
alter table public.session_npcs enable row level security;
alter table public.session_participants enable row level security;

-- Policies for game_sessions
create policy "GMs can create sessions"
  on public.game_sessions for insert
  with check (auth.uid() = gm_id);

create policy "Users can view sessions they are part of or created"
  on public.game_sessions for select
  using (
    auth.uid() = gm_id or
    exists (
      select 1 from public.session_participants
      where session_participants.session_id = game_sessions.id
      and session_participants.user_id = auth.uid()
    )
  );

create policy "GMs can update their sessions"
  on public.game_sessions for update
  using (auth.uid() = gm_id);

-- Policies for session_enemies
create policy "Users can view session enemies"
  on public.session_enemies for select
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = session_enemies.session_id
      and (
        game_sessions.gm_id = auth.uid() or
        exists (
          select 1 from public.session_participants
          where session_participants.session_id = game_sessions.id
          and session_participants.user_id = auth.uid()
        )
      )
    )
  );

create policy "GMs can manage session enemies"
  on public.session_enemies for all
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = session_enemies.session_id
      and game_sessions.gm_id = auth.uid()
    )
  );

-- Policies for session_npcs
create policy "Users can view session npcs"
  on public.session_npcs for select
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = session_npcs.session_id
      and (
        game_sessions.gm_id = auth.uid() or
        exists (
          select 1 from public.session_participants
          where session_participants.session_id = game_sessions.id
          and session_participants.user_id = auth.uid()
        )
      )
    )
  );

create policy "GMs can manage session npcs"
  on public.session_npcs for all
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = session_npcs.session_id
      and game_sessions.gm_id = auth.uid()
    )
  );

-- Policies for session_participants
create policy "Users can view session participants"
  on public.session_participants for select
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = session_participants.session_id
      and (
        game_sessions.gm_id = auth.uid() or
        session_participants.user_id = auth.uid()
      )
    )
  );

create policy "GMs can manage session participants"
  on public.session_participants for all
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = session_participants.session_id
      and game_sessions.gm_id = auth.uid()
    )
  );

create policy "Users can join sessions they are invited to"
  on public.session_participants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.session_enemies;
alter publication supabase_realtime add table public.session_npcs;
alter publication supabase_realtime add table public.characters;

-- Create RPC for atomic session creation
create or replace function public.create_game_session(
  session_name text,
  session_description text,
  enemies jsonb,
  npcs jsonb,
  participant_character_ids uuid[]
) returns uuid as $$
declare
  new_session_id uuid;
  char_record record;
  enemy_record record;
  npc_record record;
begin
  -- 1. Create Session
  insert into public.game_sessions (name, description, gm_id, status)
  values (session_name, session_description, auth.uid(), 'active')
  returning id into new_session_id;

  -- 2. Insert Enemies
  if jsonb_typeof(enemies) = 'array' then
    for enemy_record in select * from jsonb_to_recordset(enemies) as x(base_enemy_id text, name text, max_hp int, current_hp int) loop
      insert into public.session_enemies (session_id, base_enemy_id, name, max_hp, current_hp)
      values (new_session_id, enemy_record.base_enemy_id, enemy_record.name, enemy_record.max_hp, enemy_record.current_hp);
    end loop;
  end if;

  -- 3. Insert NPCs
  if jsonb_typeof(npcs) = 'array' then
    for npc_record in select * from jsonb_to_recordset(npcs) as x(name text, description text, stats jsonb) loop
      insert into public.session_npcs (session_id, name, description, stats)
      values (new_session_id, npc_record.name, npc_record.description, npc_record.stats);
    end loop;
  end if;

  -- 4. Insert Participants
  if array_length(participant_character_ids, 1) > 0 then
    for char_record in select id, user_id from public.characters where id = any(participant_character_ids) loop
      insert into public.session_participants (session_id, character_id, user_id)
      values (new_session_id, char_record.id, char_record.user_id);
    end loop;
  end if;

  return new_session_id;
end;
$$ language plpgsql security definer;
