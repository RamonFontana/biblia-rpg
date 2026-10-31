-- Pins do mapa (Onda 6, passo 2, ticket 05): onde cada Retrato está em cada mapa da sessão. Quem não
-- tem linha aqui espera na Bandeja do Mestre. O Retrato é uma ficha (jogador, NPC jogável ou
-- inimigo) ou um NPC simples, nunca os dois. Só o Mestre da sessão escreve; os participantes leem.

create table public.session_map_pins (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.session_maps (id) on delete cascade,
  character_id uuid references public.characters (id) on delete cascade,
  npc_id uuid references public.session_npcs (id) on delete cascade,
  col integer not null check (col >= 0),
  row integer not null check (row >= 0),
  created_at timestamptz not null default now(),
  check ((character_id is null) <> (npc_id is null)),
  unique (map_id, character_id),
  unique (map_id, npc_id)
);

alter table public.session_map_pins enable row level security;

create policy "GMs can manage map pins"
  on public.session_map_pins for all to authenticated
  using (
    exists (
      select 1 from public.session_maps m
      where m.id = session_map_pins.map_id and public.is_session_gm(m.session_id)
    )
  )
  with check (
    exists (
      select 1 from public.session_maps m
      where m.id = session_map_pins.map_id and public.is_session_gm(m.session_id)
    )
  );

create policy "Session members can view map pins"
  on public.session_map_pins for select to authenticated
  using (
    exists (
      select 1 from public.session_maps m
      where m.id = session_map_pins.map_id and public.is_session_participant(m.session_id)
    )
  );

revoke all on public.session_map_pins from anon;

-- O pin cabe no mapa: o Quadrado precisa existir nas colunas e linhas dele.
create or replace function public.check_map_pin_in_bounds()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_columns integer;
  v_rows integer;
begin
  select columns, rows into v_columns, v_rows from public.session_maps where id = new.map_id;
  if new.col >= v_columns or new.row >= v_rows then
    raise exception 'O pin está fora do mapa' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger session_map_pins_in_bounds
  before insert or update of col, row on public.session_map_pins
  for each row execute function public.check_map_pin_in_bounds();

alter publication supabase_realtime add table public.session_map_pins;
