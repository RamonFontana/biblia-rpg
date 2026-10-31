-- Oculto (Onda 6, passo 2, ticket 08; ADR 0011): o Mestre tira um Retrato da vista dos jogadores, e a
-- tela os esconde. Nada disso é segredo no servidor (mesa de amigos, ADR 0004).
--
-- 1. O participante passa a ler a linha de todo NPC simples da sessão, também a do Oculto: o Realtime
--    só avisa de uma mudança quem ainda pode ler a linha, então o NPC ocultado nunca sumia ao vivo
--    da tela dos jogadores. Agora a linha chega e a tela filtra, como já faz com a ficha do NPC
--    jogável e a do inimigo.
-- 2. O inimigo entra Oculto: ao ganhar o primeiro pin da sessão, `characters.is_visible` vai a falso
--    (o Mestre o revela quando quiser). Um segundo pin do mesmo inimigo, em outro mapa, não o esconde
--    de novo.

drop policy "Users can view session npcs" on public.session_npcs;

create policy "Users can view session npcs"
  on public.session_npcs for select to authenticated
  using (public.is_session_gm(session_id) or public.is_session_participant(session_id));

create or replace function public.hide_enemy_on_first_pin()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_session_id uuid;
begin
  if new.character_id is null then
    return new;
  end if;
  if not exists (
    select 1 from public.characters where id = new.character_id and is_enemy
  ) then
    return new;
  end if;

  select session_id into v_session_id from public.session_maps where id = new.map_id;
  if exists (
    select 1
    from public.session_map_pins p
    join public.session_maps m on m.id = p.map_id
    where m.session_id = v_session_id
      and p.character_id = new.character_id
      and p.id <> new.id
  ) then
    return new;
  end if;

  update public.characters set is_visible = false where id = new.character_id;
  return new;
end;
$$;

revoke execute on function public.hide_enemy_on_first_pin() from public, anon;

create trigger session_map_pins_hide_enemy
  after insert on public.session_map_pins
  for each row execute function public.hide_enemy_on_first_pin();
