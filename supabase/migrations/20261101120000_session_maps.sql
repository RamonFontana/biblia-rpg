-- Mapa da sessão (Onda 6, passo 2, ticket 02): os mapas que o Mestre soma à sessão e o Mapa atual,
-- o que os jogadores veem no Palco. Esta migration traz só mapas da Biblioteca (terrenos lisos); o
-- mapa enviado pelo Mestre entra no ticket 07 (ADR 0010). O mapa que o Mestre prepara fica só na
-- tela dele, não vai ao banco.

create table public.session_maps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  -- O `id` da entrada em `src/content/maps.ts`: nunca renomeado.
  library_id text not null,
  name text not null check (char_length(name) between 1 and 80),
  columns integer not null check (columns between 5 and 60),
  rows integer not null check (rows between 5 and 60),
  grid_visible boolean not null default true,
  -- Nulo = o Ambiente segue o período (manhã e tarde claras, noite escura).
  ambient text check (ambient in ('claro', 'penumbra', 'escuridao')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, session_id)
);

create index session_maps_session_id_idx on public.session_maps (session_id);

alter table public.session_maps enable row level security;

create policy "GMs can manage session maps"
  on public.session_maps for all to authenticated
  using (public.is_session_gm(session_id))
  with check (public.is_session_gm(session_id));

create policy "Session members can view session maps"
  on public.session_maps for select to authenticated
  using (public.is_session_participant(session_id));

revoke all on public.session_maps from anon;

-- O Mapa atual: um mapa da própria sessão (a chave composta impede apontar para o de outra).
-- Apagar o mapa mostrado devolve os jogadores ao Palco de Retratos.
alter table public.game_sessions
  add column shown_map_id uuid;

alter table public.game_sessions
  add constraint game_sessions_shown_map_fkey
  foreign key (shown_map_id, id) references public.session_maps (id, session_id)
  on delete set null (shown_map_id);

alter publication supabase_realtime add table public.session_maps;
