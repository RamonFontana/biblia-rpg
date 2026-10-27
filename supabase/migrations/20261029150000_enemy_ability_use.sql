-- Habilidade de inimigo (Onda 5, feature 4; ADR 0007): o Mestre usa uma Habilidade de um inimigo
-- contra personagens. O TR de cada jogador chega ao celular pelo Teste de sessão (`session_tests`);
-- o uso fica pendente, ligado a esse Teste, e o Mestre o resolve com `resolve_ability_use` quando os
-- resultados chegam (as Condições entram só em quem falhou). Sem TR, as Condições entram na hora.
--
-- Só o Mestre da sessão grava (o inimigo não tem dono). A conta (CD, quem falhou, Resistência a
-- Condição, imunidades) fica no motor do cliente (ADR 0004): a função valida o combate ativo, o
-- Mestre, o inimigo como autor e os alvos como personagens do mesmo combate.

alter table public.combat_ability_uses
  add column test_id uuid references public.session_tests (id) on delete set null;

create function public.record_enemy_ability_use(
  p_enemy_participant_id uuid,
  p_ability_id text,
  p_ability_name text,
  p_targets jsonb,
  p_save jsonb default null,
  p_test_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_enemy public.combat_participants%rowtype;
  v_combat public.combats%rowtype;
  v_target public.combat_participants%rowtype;
  v_entry jsonb;
  v_conditions jsonb;
  v_name text;
  v_results jsonb := '[]'::jsonb;
  v_use_id uuid;
  v_pending boolean := p_save is not null;
  v_cd integer;
  v_attribute text;
begin
  if p_targets is null or jsonb_typeof(p_targets) <> 'array' or jsonb_array_length(p_targets) = 0 then
    raise exception 'Escolha ao menos um alvo' using errcode = '22023';
  end if;

  if v_pending then
    v_attribute := p_save ->> 'attribute';
    if v_attribute is null or v_attribute not in ('for', 'des', 'con', 'int', 'sab', 'car') then
      raise exception 'Atributo do TR inválido' using errcode = '22023';
    end if;
    begin
      v_cd := (p_save ->> 'cd')::integer;
    exception when others then
      raise exception 'CD do TR inválida' using errcode = '22023';
    end;
    if v_cd is null or v_cd < 1 or v_cd > 40 then
      raise exception 'CD do TR inválida' using errcode = '22023';
    end if;
  end if;

  select * into v_enemy from public.combat_participants where id = p_enemy_participant_id;
  if not found then
    raise exception 'Participante não encontrado' using errcode = '42501';
  end if;

  select * into v_combat from public.combats where id = v_enemy.combat_id;
  if not public.is_session_gm(v_combat.session_id) then
    raise exception 'Apenas o Mestre usa a Habilidade de um inimigo' using errcode = '42501';
  end if;

  if v_combat.status <> 'active' then
    raise exception 'O combate não está ativo' using errcode = '42501';
  end if;

  if v_enemy.entity_type <> 'enemy' then
    raise exception 'Só um inimigo usa Habilidade de inimigo' using errcode = '42501';
  end if;

  -- O Teste que leva o TR aos jogadores é desta sessão.
  if p_test_id is not null and not exists (
    select 1 from public.session_tests t
    where t.id = p_test_id and t.session_id = v_combat.session_id
  ) then
    raise exception 'O Teste não é desta sessão' using errcode = '42501';
  end if;

  for v_entry in select * from jsonb_array_elements(p_targets) loop
    select * into v_target
    from public.combat_participants
    where id = (v_entry ->> 'participantId')::uuid and combat_id = v_combat.id
    for update;
    if not found then
      raise exception 'O alvo não está neste combate' using errcode = '42501';
    end if;
    if v_target.entity_type = 'enemy' then
      raise exception 'A Habilidade de inimigo mira personagens' using errcode = '42501';
    end if;

    -- Com TR nada é aplicado agora: as Condições esperam os testes dos jogadores.
    v_conditions := case when v_pending then '[]'::jsonb else coalesce(v_entry -> 'conditions', '[]'::jsonb) end;
    -- Uma Condição que o alvo já tem é trocada (a duração reinicia) e vai para o fim, como
    -- `mergeCondition` no cliente.
    if jsonb_array_length(v_conditions) > 0 then
      update public.combat_participants
      set conditions = coalesce(
        (
          select jsonb_agg(c)
          from jsonb_array_elements(conditions) c
          where c ->> 'conditionId' not in (
            select n ->> 'conditionId' from jsonb_array_elements(v_conditions) n
          )
        ),
        '[]'::jsonb
      ) || v_conditions
      where id = v_target.id;
    end if;

    v_name := coalesce(
      (select name from public.characters where id = v_target.entity_id),
      (select name from public.session_npcs where id = v_target.entity_id),
      'Desconhecido'
    );
    v_results := v_results || jsonb_build_object(
      'participantId', v_target.id, 'name', v_name, 'conditions', v_conditions
    );
  end loop;

  insert into public.combat_ability_uses (
    combat_id, user_participant_id, user_name, ability_id, ability_name, action_type, targets,
    status, cd, save_attribute, test_id
  ) values (
    v_combat.id, v_enemy.id,
    coalesce((select name from public.characters where id = v_enemy.entity_id), 'Desconhecido'),
    p_ability_id, p_ability_name, 'action', v_results,
    case when v_pending then 'pending' else 'applied' end, v_cd, v_attribute, p_test_id
  )
  returning id into v_use_id;

  return v_use_id;
end;
$$;

revoke execute on function public.record_enemy_ability_use(uuid, text, text, jsonb, jsonb, uuid) from public, anon;
