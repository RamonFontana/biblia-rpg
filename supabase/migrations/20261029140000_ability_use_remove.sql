-- Habilidade que tira Condição de aliados (Onda 5, feature 4; ADR 0007): Purificação, O Unificador,
-- Ungido e Cataplasma de Gileade. `record_ability_use` aceita, por alvo, `remove` (os ids das
-- Condições a tirar); saem só as que o alvo tem, na hora, sem TR e sem Resistência a Condição, e o
-- uso grava em `removed` o que de fato saiu. Com TR (`p_save`) nada é removido agora, e inimigo não
-- perde Condição por Habilidade. A assinatura não muda: o resto da função é o do ticket anterior.

create or replace function public.record_ability_use(
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
  v_remove jsonb;
  v_removed jsonb;
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

    -- Habilidade que tira Condição de um aliado (sem TR e sem Resistência a Condição): só saem as
    -- que o alvo tem. Com TR nada é removido agora; inimigo não perde Condição por Habilidade.
    v_remove := case when v_pending then '[]'::jsonb else coalesce(v_entry -> 'remove', '[]'::jsonb) end;
    if jsonb_typeof(v_remove) <> 'array' then
      raise exception 'Condições a remover inválidas' using errcode = '22023';
    end if;
    v_removed := '[]'::jsonb;
    if jsonb_array_length(v_remove) > 0 then
      if v_target.entity_type = 'enemy' then
        raise exception 'Só se tira Condição de aliados' using errcode = '42501';
      end if;
      select coalesce(jsonb_agg(c ->> 'conditionId'), '[]'::jsonb) into v_removed
      from public.combat_participants p, jsonb_array_elements(p.conditions) c
      where p.id = v_target.id
        and c ->> 'conditionId' in (select jsonb_array_elements_text(v_remove));
      update public.combat_participants
      set conditions = coalesce(
        (
          select jsonb_agg(c)
          from jsonb_array_elements(conditions) c
          where c ->> 'conditionId' not in (select jsonb_array_elements_text(v_remove))
        ),
        '[]'::jsonb
      )
      where id = v_target.id;
    end if;

    v_name := coalesce(
      (select name from public.characters where id = v_target.entity_id),
      (select name from public.session_npcs where id = v_target.entity_id),
      'Desconhecido'
    );
    -- O objeto do alvo é montado inteiro (com `removed` só quando o uso pediu remoção) antes de
    -- entrar no array: `array || objeto || objeto` acrescentaria dois elementos.
    v_results := v_results || (
      jsonb_build_object('participantId', v_target.id, 'name', v_name, 'conditions', v_conditions)
      || case when v_entry ? 'remove' then jsonb_build_object('removed', v_removed) else '{}'::jsonb end
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

-- `create or replace` mantém os privilégios; o revoke fica explícito para o gate de RLS.
revoke execute on function public.record_ability_use(uuid, text, text, text, jsonb, jsonb) from public, anon;
