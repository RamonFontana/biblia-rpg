-- Tocha acesa (Onda 6, passo 2, ticket 11; regras-base 6.7). A Tocha acesa é estado do personagem
-- (`characters.torch_lit`): atravessa a troca de mapa e a luz dela (6 m de Luz plena + 6 m de
-- Penumbra) é desenhada no pin do personagem. Acende o dono ou o Mestre de uma sessão dele, e a
-- função tira uma Tocha do inventário na mesma transação. Só o Mestre apaga; o Descanso Curto (ao
-- abrir) e o Descanso Longo (ao fechar o dia) apagam as Tochas de quem está na sessão.

alter table public.characters
  add column torch_lit boolean not null default false;

-- O estado só muda pelas funções abaixo e pelo gatilho dos descansos: qualquer outra escrita na
-- ficha (o jogador apagando a própria Tocha, uma ficha velha devolvendo `true`) é desfeita em silêncio.
create or replace function public.guard_torch_lit()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.torch_lit is distinct from old.torch_lit
     and coalesce(current_setting('app.torch_rpc', true), '') <> 'on' then
    new.torch_lit := old.torch_lit;
  end if;
  return new;
end;
$$;

create trigger characters_guard_torch_lit
  before update on public.characters
  for each row execute function public.guard_torch_lit();

-- Quem pode mexer na Tocha do personagem: o dono dele ou o Mestre de uma sessão em que ele está.
create or replace function public.can_handle_torch(p_character_id uuid, p_gm_only boolean)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select auth.uid() is not null and (
    (not p_gm_only and exists (
      select 1 from public.characters c where c.id = p_character_id and c.user_id = auth.uid()
    ))
    or exists (
      select 1
      from public.session_participants sp
      join public.game_sessions gs on gs.id = sp.session_id
      where sp.character_id = p_character_id and gs.gm_id = auth.uid()
    )
  );
$$;

create or replace function public.light_torch(p_character_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_lit boolean;
  v_item uuid;
  v_quantity integer;
begin
  if not public.can_handle_torch(p_character_id, false) then
    raise exception 'Só o dono do personagem ou o Mestre acende a Tocha' using errcode = '42501';
  end if;

  select torch_lit into v_lit from public.characters where id = p_character_id for update;
  if not found or coalesce(v_lit, false) then
    raise exception 'A Tocha já está acesa' using errcode = '42501';
  end if;

  select ci.id, ci.quantity into v_item, v_quantity
  from public.character_items ci
  join public.items i on i.id = ci.item_id
  where ci.character_id = p_character_id and i.slug = 'tocha' and coalesce(ci.quantity, 0) > 0
  order by ci.created_at
  limit 1
  for update of ci;
  if v_item is null then
    raise exception 'Sem Tocha no inventário' using errcode = '42501';
  end if;

  if v_quantity <= 1 then
    delete from public.character_items where id = v_item;
  else
    update public.character_items set quantity = v_quantity - 1 where id = v_item;
  end if;

  perform set_config('app.torch_rpc', 'on', true);
  update public.characters set torch_lit = true where id = p_character_id;
  perform set_config('app.torch_rpc', 'off', true);
end;
$$;

create or replace function public.extinguish_torch(p_character_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.can_handle_torch(p_character_id, true) then
    raise exception 'Só o Mestre apaga a Tocha' using errcode = '42501';
  end if;
  perform set_config('app.torch_rpc', 'on', true);
  update public.characters set torch_lit = false where id = p_character_id;
  perform set_config('app.torch_rpc', 'off', true);
end;
$$;

-- Os descansos apagam as Tochas: ao abrir o Descanso Curto e quando o Descanso Longo fecha o dia.
create or replace function public.extinguish_session_torches()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (old.short_rest_id is null and new.short_rest_id is not null)
     or new.last_long_rest_day is distinct from old.last_long_rest_day then
    perform set_config('app.torch_rpc', 'on', true);
    update public.characters
    set torch_lit = false
    where torch_lit
      and id in (select character_id from public.session_participants where session_id = new.id);
    perform set_config('app.torch_rpc', 'off', true);
  end if;
  return new;
end;
$$;

create trigger game_sessions_extinguish_torches
  after update on public.game_sessions
  for each row execute function public.extinguish_session_torches();

revoke execute on function public.can_handle_torch(uuid, boolean) from public, anon;
revoke execute on function public.light_torch(uuid) from public, anon;
revoke execute on function public.extinguish_torch(uuid) from public, anon;
revoke execute on function public.extinguish_session_torches() from public, anon;
revoke execute on function public.guard_torch_lit() from public, anon;
