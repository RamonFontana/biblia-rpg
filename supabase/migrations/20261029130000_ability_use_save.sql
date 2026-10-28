-- Habilidade com TR (Onda 5, feature 4; ADR 0007): o uso fica pendente até o Mestre lançar o TR de
-- cada alvo, e só então as Condições entram em quem falhou.
--
-- `record_ability_use` ganha o parâmetro `p_save` ({attribute, cd}): com ele, o uso é gravado como
-- `pending`, com a CD e o atributo do TR, e nenhuma Condição é aplicada ainda. `resolve_ability_use`
-- (só o Mestre) recebe o resultado de cada alvo, já calculado pelo motor do cliente (ADR 0004):
-- aplica as Condições de quem falhou, grava os dados e marca o uso como `resolved`. Um uso pendente
-- de um combate encerrado não resolve: vira `expired`, sem efeito.

alter table public.combat_ability_uses
  add column save_attribute text check (save_attribute in ('for', 'des', 'con', 'int', 'sab', 'car'));

-- A assinatura muda (um parâmetro novo): a antiga sai para não deixar duas versões da função.
drop function public.record_ability_use(uuid, text, text, text, jsonb);

create function public.record_ability_use(
  p_user_participant_id uuid,
  p_ability_id text,
  p_ability_name text,
  p_action_type text,
  p_targets jsonb,
  p_save jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user public.combat_participants%rowtype;
  v_combat public.combats%rowtype;
  v_count integer;
  v_current_id uuid;
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

  select * into v_user from public.combat_participants where id = p_user_participant_id;
  if not found then
    raise exception 'Participante não encontrado' using errcode = '42501';
  end if;

  select * into v_combat from public.combats where id = v_user.combat_id;
  if v_combat.status <> 'active' then
    raise exception 'O combate não está ativo' using errcode = '42501';
  end if;

  -- Só o dono do personagem usa a Habilidade por ele.
  if v_user.entity_type <> 'player'
     or not exists (
       select 1 from public.characters c
       where c.id = v_user.entity_id and c.user_id = auth.uid()
     ) then
    raise exception 'Apenas o dono do personagem usa a Habilidade por ele' using errcode = '42501';
  end if;

  if v_user.hp_current <= 0 then
    raise exception 'Quem está a 0 PV não usa Habilidades' using errcode = '42501';
  end if;

  -- Ação e Ação Bônus são do próprio turno (a ordem é a da iniciativa, como a tela a monta); a
  -- Reação e a Ação Livre valem a qualquer momento.
  if p_action_type in ('action', 'bonus_action') then
    select count(*) into v_count from public.combat_participants where combat_id = v_combat.id;
    select id into v_current_id
    from public.combat_participants
    where combat_id = v_combat.id
    order by initiative desc, created_at, id
    offset (v_combat.current_turn_index % v_count) limit 1;
    if v_current_id is distinct from v_user.id then
      raise exception 'Não é o turno de quem usa a Habilidade' using errcode = '42501';
    end if;
  end if;

  for v_entry in select * from jsonb_array_elements(p_targets) loop
    select * into v_target
    from public.combat_participants
    where id = (v_entry ->> 'participantId')::uuid and combat_id = v_combat.id
    for update;
    if not found then
      raise exception 'O alvo não está neste combate' using errcode = '42501';
    end if;

    -- Com TR nada é aplicado agora: as Condições esperam o Mestre lançar os testes.
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
    status, cd, save_attribute
  ) values (
    v_combat.id, v_user.id,
    coalesce(
      (select name from public.characters where id = v_user.entity_id),
      'Desconhecido'
    ),
    p_ability_id, p_ability_name, p_action_type, v_results,
    case when v_pending then 'pending' else 'applied' end, v_cd, v_attribute
  )
  returning id into v_use_id;

  return v_use_id;
end;
$$;

revoke execute on function public.record_ability_use(uuid, text, text, text, jsonb, jsonb) from public, anon;

-- O Mestre lança o TR de cada alvo de um uso pendente. `p_results` traz, por alvo, o que o motor
-- calculou: `{participantId, natural, total, failed, mode, conditions}`. Só as Condições de quem
-- falhou entram. Devolve 'resolved' ou, se o combate já acabou, 'expired' (sem efeito).
create function public.resolve_ability_use(p_use_id uuid, p_results jsonb)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_use public.combat_ability_uses%rowtype;
  v_combat public.combats%rowtype;
  v_stored jsonb;
  v_entry jsonb;
  v_result jsonb;
  v_failed boolean;
  v_conditions jsonb;
  v_target_id uuid;
  v_final jsonb := '[]'::jsonb;
begin
  select * into v_use from public.combat_ability_uses where id = p_use_id for update;
  if not found then
    raise exception 'Uso não encontrado' using errcode = '22023';
  end if;

  select * into v_combat from public.combats where id = v_use.combat_id;
  if not public.is_session_gm(v_combat.session_id) then
    raise exception 'Apenas o Mestre resolve o TR de uma Habilidade' using errcode = '42501';
  end if;

  if v_use.status <> 'pending' then
    raise exception 'O uso não está pendente' using errcode = '22023';
  end if;

  -- Combate encerrado: o uso cai sem efeito (o uso e a Fé da Habilidade já foram gastos).
  if v_combat.status <> 'active' then
    update public.combat_ability_uses set status = 'expired' where id = v_use.id;
    return 'expired';
  end if;

  if p_results is null or jsonb_typeof(p_results) <> 'array' then
    raise exception 'Resultados inválidos' using errcode = '22023';
  end if;

  -- Cada alvo do uso precisa de um resultado.
  for v_stored in select * from jsonb_array_elements(v_use.targets) loop
    select r into v_result
    from jsonb_array_elements(p_results) r
    where r ->> 'participantId' = v_stored ->> 'participantId'
    limit 1;
    if v_result is null then
      raise exception 'Falta o resultado de um alvo' using errcode = '22023';
    end if;

    v_target_id := (v_stored ->> 'participantId')::uuid;
    v_failed := coalesce((v_result ->> 'failed')::boolean, false);
    v_conditions := case when v_failed then coalesce(v_result -> 'conditions', '[]'::jsonb) else '[]'::jsonb end;

    perform 1 from public.combat_participants
      where id = v_target_id and combat_id = v_combat.id for update;
    if not found then
      raise exception 'O alvo não está neste combate' using errcode = '42501';
    end if;

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
      where id = v_target_id;
    end if;

    v_final := v_final || jsonb_build_object(
      'participantId', v_target_id,
      'name', v_stored ->> 'name',
      'conditions', v_conditions,
      'natural', v_result -> 'natural',
      'total', v_result -> 'total',
      'failed', v_failed,
      'mode', coalesce(v_result ->> 'mode', 'normal')
    );
  end loop;

  update public.combat_ability_uses
  set targets = v_final, status = 'resolved'
  where id = v_use.id;
  return 'resolved';
end;
$$;

revoke execute on function public.resolve_ability_use(uuid, jsonb) from public, anon;
