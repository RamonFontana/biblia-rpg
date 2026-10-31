-- Luz no mapa (Onda 6, passo 2, ticket 09; regras-base 6.7): as Fontes de luz fixas que o Mestre põe
-- no mapa (fogueira, braseiro, janela) e a luz no pin de um inimigo ou NPC. Cada fonte tem um raio de
-- Luz plena e uma faixa de Penumbra depois dele, em metros. Só o Mestre da sessão escreve; os
-- participantes leem. A luz é só da tela (ADR 0011).

create table public.session_map_lights (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.session_maps (id) on delete cascade,
  col integer not null check (col >= 0),
  row integer not null check (row >= 0),
  bright_m numeric(5, 1) not null check (bright_m >= 0 and bright_m <= 120),
  dim_m numeric(5, 1) not null check (dim_m >= 0 and dim_m <= 120),
  label text not null default 'Luz' check (char_length(label) between 1 and 40),
  created_at timestamptz not null default now()
);

create index session_map_lights_map_id_idx on public.session_map_lights (map_id);

alter table public.session_map_lights enable row level security;

create policy "GMs can manage map lights"
  on public.session_map_lights for all to authenticated
  using (
    exists (
      select 1 from public.session_maps m
      where m.id = session_map_lights.map_id and public.is_session_gm(m.session_id)
    )
  )
  with check (
    exists (
      select 1 from public.session_maps m
      where m.id = session_map_lights.map_id and public.is_session_gm(m.session_id)
    )
  );

create policy "Session members can view map lights"
  on public.session_map_lights for select to authenticated
  using (
    exists (
      select 1 from public.session_maps m
      where m.id = session_map_lights.map_id and public.is_session_participant(m.session_id)
    )
  );

revoke all on public.session_map_lights from anon;

-- A luz cabe no mapa, como o pin (a mesma função serve: lê só `map_id`, `col` e `row`).
create trigger session_map_lights_in_bounds
  before insert or update of col, row on public.session_map_lights
  for each row execute function public.check_map_pin_in_bounds();

-- A luz no pin: os dois raios juntos ou nenhum (nulo = sem luz).
alter table public.session_map_pins
  add column light_bright_m numeric(5, 1) check (light_bright_m >= 0 and light_bright_m <= 120),
  add column light_dim_m numeric(5, 1) check (light_dim_m >= 0 and light_dim_m <= 120),
  add constraint session_map_pins_light_together
    check ((light_bright_m is null) = (light_dim_m is null));

alter publication supabase_realtime add table public.session_map_lights;
