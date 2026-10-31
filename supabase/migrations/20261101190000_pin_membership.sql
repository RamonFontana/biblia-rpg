-- Revisão do mapa: o pin só vale para quem é da sessão do mapa. Sem isso, o Mestre de uma sessão
-- punha no mapa dele a ficha (ou o NPC) de outra sessão, e o gatilho SECURITY DEFINER do Oculto
-- mudava o `is_visible` dela. É da sessão a ficha que participa dela, ou o inimigo e o NPC jogável
-- que o próprio Mestre dela criou; o NPC simples é da sessão que o guarda.

create or replace function public.check_map_pin_member()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_session_id uuid;
  v_gm uuid;
begin
  select m.session_id, s.gm_id into v_session_id, v_gm
  from public.session_maps m
  join public.game_sessions s on s.id = m.session_id
  where m.id = new.map_id;

  if new.character_id is not null then
    if not exists (
      select 1 from public.session_participants
      where session_id = v_session_id and character_id = new.character_id
    ) and not exists (
      select 1 from public.characters c
      where c.id = new.character_id and c.user_id = v_gm and (c.is_enemy or c.is_npc)
    ) then
      raise exception 'O personagem não é desta sessão' using errcode = '23514';
    end if;
  elsif not exists (
    select 1 from public.session_npcs where id = new.npc_id and session_id = v_session_id
  ) then
    raise exception 'O NPC não é desta sessão' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_map_pin_member() from public, anon;

create trigger session_map_pins_member
  before insert or update of character_id, npc_id, map_id on public.session_map_pins
  for each row execute function public.check_map_pin_member();
