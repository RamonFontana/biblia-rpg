-- Mapas do Mestre (Onda 6, passo 2, ticket 07; ADR 0010): o Mestre envia uma imagem, recorta em
-- Quadrados e a guarda como mapa dele, que serve a qualquer sessão dele. A imagem (webp em base64)
-- fica numa tabela própria, FORA da publicação do Realtime: a troca do Mapa atual manda só o id, e a
-- imagem é lida à parte, por id.

create table public.master_maps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  columns integer not null check (columns between 5 and 60),
  rows integer not null check (rows between 5 and 60),
  grid_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index master_maps_owner_id_idx on public.master_maps (owner_id);

create table public.master_map_images (
  map_id uuid primary key references public.master_maps (id) on delete cascade,
  -- webp de até 2048 px em base64 (cerca de 33% maior que o arquivo); o teto protege o banco.
  image text not null check (image like 'data:image/webp;base64,%' and char_length(image) <= 8000000),
  created_at timestamptz not null default now()
);

-- O mapa da sessão vem da Biblioteca ou de um mapa do Mestre: exatamente uma origem.
alter table public.session_maps
  alter column library_id drop not null,
  add column master_map_id uuid references public.master_maps (id) on delete cascade,
  add constraint session_maps_one_origin check ((library_id is null) <> (master_map_id is null));

alter table public.master_maps enable row level security;
alter table public.master_map_images enable row level security;

create policy "Owners can manage their maps"
  on public.master_maps for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Session members can view maps their session uses"
  on public.master_maps for select to authenticated
  using (
    exists (
      select 1 from public.session_maps sm
      where sm.master_map_id = master_maps.id and public.is_session_participant(sm.session_id)
    )
  );

create policy "Owners can manage their map images"
  on public.master_map_images for all to authenticated
  using (
    exists (select 1 from public.master_maps m where m.id = master_map_images.map_id and m.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.master_maps m where m.id = master_map_images.map_id and m.owner_id = auth.uid())
  );

create policy "Session members can view images of maps their session uses"
  on public.master_map_images for select to authenticated
  using (
    exists (
      select 1 from public.session_maps sm
      where sm.master_map_id = master_map_images.map_id and public.is_session_participant(sm.session_id)
    )
  );

revoke all on public.master_maps from anon;
revoke all on public.master_map_images from anon;

-- Não se apaga um mapa que uma sessão ativa usa.
create or replace function public.block_master_map_in_use()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if exists (
    select 1
    from public.session_maps sm
    join public.game_sessions gs on gs.id = sm.session_id
    where sm.master_map_id = old.id and gs.status = 'active'
  ) then
    raise exception 'O mapa está em uso por uma sessão ativa' using errcode = '23503';
  end if;
  return old;
end;
$$;

create trigger master_maps_block_delete_in_use
  before delete on public.master_maps
  for each row execute function public.block_master_map_in_use();

-- O Mestre da sessão só usa mapa que é dele (a chave estrangeira não passa pelo RLS). A conferência
-- é uma função SECURITY DEFINER para não fechar um ciclo de políticas: a de `master_maps` olha
-- `session_maps`, e a de `session_maps` olharia `master_maps`.
create or replace function public.owns_master_map(p_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.master_maps where id = p_map_id and owner_id = auth.uid()
  );
$$;

revoke execute on function public.owns_master_map(uuid) from public, anon;
grant execute on function public.owns_master_map(uuid) to authenticated;

drop policy "GMs can manage session maps" on public.session_maps;
create policy "GMs can manage session maps"
  on public.session_maps for all to authenticated
  using (public.is_session_gm(session_id))
  with check (
    public.is_session_gm(session_id)
    and (master_map_id is null or public.owns_master_map(master_map_id))
  );
