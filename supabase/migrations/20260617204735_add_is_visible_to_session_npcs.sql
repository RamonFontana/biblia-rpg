-- Add is_visible to session_npcs
alter table public.session_npcs add column is_visible boolean not null default false;

-- Update RLS policy so players only see visible NPCs
drop policy if exists "Users can view session npcs" on public.session_npcs;

create policy "Users can view session npcs"
  on public.session_npcs for select
  using (
    public.is_session_gm(session_id) 
    or (public.is_session_participant(session_id) and is_visible = true)
  );

-- Also need to update the RPC create_game_session to accept is_visible
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
    for npc_record in select * from jsonb_to_recordset(npcs) as x(name text, description text, stats jsonb, is_visible boolean) loop
      insert into public.session_npcs (session_id, name, description, stats, is_visible)
      values (new_session_id, npc_record.name, npc_record.description, npc_record.stats, coalesce(npc_record.is_visible, false));
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

