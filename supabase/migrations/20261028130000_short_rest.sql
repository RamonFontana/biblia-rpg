-- Descanso Curto como momento aberto da sessão (Onda 5, feature 3; ADR 0006). O Mestre abre e
-- encerra por duas funções SECURITY DEFINER, que juntas guardam a regra de abrir (combate, limite
-- do dia, descanso já aberto) num lugar só; o pedido dos jogadores (ticket 05) usa as mesmas
-- colunas. A recarga das Habilidades fica no cliente (ADR 0004): cada ficha guarda a identidade do
-- último descanso em que recarregou (`characters.last_short_rest_recharge`).
--
-- `short_rest_id` é a identidade do descanso aberto (nulo = fechado). Quem pediu e quem terminou são
-- listas de personagens. O Mestre continua fechando o descanso pela atualização direta da sessão
-- (Descanso Longo e avanço de período), pela política que já existe. `short_rest_refused_at` guarda
-- a recusa do Pedido de Descanso pelo Mestre, para o jogador ver o aviso.

alter table public.game_sessions
  add column short_rest_id uuid,
  add column short_rest_opened_by text check (short_rest_opened_by in ('master', 'group')),
  add column short_rest_requested uuid[] not null default '{}',
  add column short_rest_finished uuid[] not null default '{}',
  add column short_rest_refused_at timestamptz,
  add constraint game_sessions_short_rest_pair_check
    check ((short_rest_id is null) = (short_rest_opened_by is null));

create or replace function public.open_short_rest(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_session public.game_sessions%rowtype;
  v_rest_id uuid := gen_random_uuid();
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Sessão não encontrada' using errcode = '42501';
  end if;

  if v_session.gm_id is distinct from auth.uid() then
    raise exception 'Apenas o Mestre abre o Descanso Curto' using errcode = '42501';
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

  update public.game_sessions
  set short_rest_id = v_rest_id,
      short_rest_opened_by = 'master',
      short_rest_requested = '{}',
      short_rest_finished = '{}',
      short_rest_refused_at = null,
      short_rests_today = coalesce(short_rests_today, 0) + 1
  where id = p_session_id;

  return v_rest_id;
end;
$$;

create or replace function public.close_short_rest(p_session_id uuid)
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
    raise exception 'Apenas o Mestre encerra o Descanso Curto' using errcode = '42501';
  end if;

  update public.game_sessions
  set short_rest_id = null,
      short_rest_opened_by = null,
      short_rest_requested = '{}',
      short_rest_finished = '{}',
      short_rest_refused_at = null
  where id = p_session_id;
end;
$$;

revoke execute on function public.open_short_rest(uuid) from public, anon;
revoke execute on function public.close_short_rest(uuid) from public, anon;
