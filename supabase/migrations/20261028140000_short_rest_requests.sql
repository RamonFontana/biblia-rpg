-- Pedido de Descanso e "Terminei" (Onda 5, feature 3; ADR 0006). O jogador não altera
-- `game_sessions`, então pedir, retirar e terminar passam por funções SECURITY DEFINER. O último
-- pedido abre o Descanso Curto "pelo grupo" e o último "Terminei" o fecha, cada um numa transação.
-- A regra de abrir (combate, limite do dia, descanso já aberto) é a mesma de `open_short_rest`.
--
-- Quem conta no "todos": os personagens de jogador da sessão (nem NPC, nem inimigo) que não estão
-- Mortos; quem está Morrendo conta. O motor (`getRestRoster`) usa a mesma definição.

create or replace function public.short_rest_player_ids(p_session_id uuid)
returns uuid[]
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(array_agg(c.id), '{}')
  from public.session_participants sp
  join public.characters c on c.id = sp.character_id
  where sp.session_id = p_session_id
    and not coalesce(c.is_enemy, false)
    and not coalesce(c.is_npc, false)
    and not coalesce(c.is_dead, false);
$$;

-- O personagem é do usuário, está na sessão, é de jogador e não está Morto.
create or replace function public.owns_short_rest_player(p_session_id uuid, p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select auth.uid() is not null
    and p_character_id = any (public.short_rest_player_ids(p_session_id))
    and exists (
      select 1 from public.characters c where c.id = p_character_id and c.user_id = auth.uid()
    );
$$;

create or replace function public.request_short_rest(p_session_id uuid, p_character_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_session public.game_sessions%rowtype;
  v_requested uuid[];
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Sessão não encontrada' using errcode = '42501';
  end if;
  if not public.owns_short_rest_player(p_session_id, p_character_id) then
    raise exception 'Só o jogador de um personagem vivo da sessão pede o descanso' using errcode = '42501';
  end if;
  if v_session.short_rest_id is not null then
    raise exception 'Já há um Descanso Curto aberto' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.combats c where c.session_id = p_session_id and c.status = 'active'
  ) then
    raise exception 'Combate em andamento' using errcode = '42501';
  end if;
  if coalesce(v_session.short_rests_today, 0) >= 2 then
    raise exception 'Sem Descanso Curto restante hoje' using errcode = '42501';
  end if;

  v_requested := array(
    select distinct x from unnest(coalesce(v_session.short_rest_requested, '{}') || p_character_id) as x
  );

  if public.short_rest_player_ids(p_session_id) <@ v_requested then
    update public.game_sessions
    set short_rest_id = gen_random_uuid(),
        short_rest_opened_by = 'group',
        short_rest_requested = '{}',
        short_rest_finished = '{}',
        short_rests_today = coalesce(short_rests_today, 0) + 1
    where id = p_session_id;
    return true;
  end if;

  update public.game_sessions set short_rest_requested = v_requested where id = p_session_id;
  return false;
end;
$$;

create or replace function public.withdraw_short_rest_request(p_session_id uuid, p_character_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform 1 from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Sessão não encontrada' using errcode = '42501';
  end if;
  if not public.owns_short_rest_player(p_session_id, p_character_id) then
    raise exception 'Só o jogador de um personagem vivo da sessão retira o pedido' using errcode = '42501';
  end if;

  update public.game_sessions
  set short_rest_requested = array_remove(short_rest_requested, p_character_id)
  where id = p_session_id;
end;
$$;

create or replace function public.finish_short_rest(p_session_id uuid, p_character_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_session public.game_sessions%rowtype;
  v_finished uuid[];
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Sessão não encontrada' using errcode = '42501';
  end if;
  if not public.owns_short_rest_player(p_session_id, p_character_id) then
    raise exception 'Só o jogador de um personagem vivo da sessão termina o descanso' using errcode = '42501';
  end if;
  if v_session.short_rest_id is null then
    raise exception 'Não há Descanso Curto aberto' using errcode = '42501';
  end if;

  v_finished := array(
    select distinct x from unnest(coalesce(v_session.short_rest_finished, '{}') || p_character_id) as x
  );

  if public.short_rest_player_ids(p_session_id) <@ v_finished then
    update public.game_sessions
    set short_rest_id = null,
        short_rest_opened_by = null,
        short_rest_requested = '{}',
        short_rest_finished = '{}'
    where id = p_session_id;
    return true;
  end if;

  update public.game_sessions set short_rest_finished = v_finished where id = p_session_id;
  return false;
end;
$$;

create or replace function public.refuse_short_rest_requests(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_gm uuid;
begin
  select gm_id into v_gm from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Sessão não encontrada' using errcode = '42501';
  end if;
  if v_gm is distinct from auth.uid() then
    raise exception 'Apenas o Mestre recusa o pedido de descanso' using errcode = '42501';
  end if;

  update public.game_sessions set short_rest_requested = '{}' where id = p_session_id;
end;
$$;

revoke execute on function public.short_rest_player_ids(uuid) from public, anon, authenticated;
revoke execute on function public.owns_short_rest_player(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.request_short_rest(uuid, uuid) from public, anon;
revoke execute on function public.withdraw_short_rest_request(uuid, uuid) from public, anon;
revoke execute on function public.finish_short_rest(uuid, uuid) from public, anon;
revoke execute on function public.refuse_short_rest_requests(uuid) from public, anon;
