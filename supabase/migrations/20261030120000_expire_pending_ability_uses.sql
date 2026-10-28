-- O uso pendente expira quando o combate acaba (Onda 5, revisão da feature 4; ADR 0007).
--
-- Antes, o uso pendente só virava `expired` quando o Mestre tentava resolver o TR depois do fim do
-- combate; até lá, o histórico dizia "aguardando o TR". Agora um gatilho em `combats` expira os
-- usos pendentes no instante em que o combate deixa de estar ativo, e cancela o Teste de sessão que
-- a Habilidade de inimigo abriu nos celulares (senão ele ficaria aberto e travaria o próximo Teste).
-- O uso e a Fé da Habilidade já foram gastos e continuam gastos.
--
-- `resolve_ability_use` passa a devolver 'expired' para um uso que o gatilho já expirou, em vez de
-- recusar com "O uso não está pendente".

create function public.expire_pending_ability_uses()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.session_tests
  set status = 'cancelled'
  where status = 'active'
    and id in (
      select test_id from public.combat_ability_uses
      where combat_id = new.id and status = 'pending' and test_id is not null
    );

  update public.combat_ability_uses
  set status = 'expired'
  where combat_id = new.id and status = 'pending';

  return new;
end;
$$;

revoke execute on function public.expire_pending_ability_uses() from public, anon;

create trigger combats_expire_pending_ability_uses
after update of status on public.combats
for each row
when (old.status = 'active' and new.status <> 'active')
execute function public.expire_pending_ability_uses();

create or replace function public.resolve_ability_use(p_use_id uuid, p_results jsonb)
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
  v_faith integer;
begin
  select * into v_use from public.combat_ability_uses where id = p_use_id for update;
  if not found then
    raise exception 'Uso não encontrado' using errcode = '22023';
  end if;

  select * into v_combat from public.combats where id = v_use.combat_id;
  if not public.is_session_gm(v_combat.session_id) then
    raise exception 'Apenas o Mestre resolve o TR de uma Habilidade' using errcode = '42501';
  end if;

  -- O fim do combate já expirou o uso (o gatilho abaixo): resolver de novo não muda nada.
  if v_use.status = 'expired' then
    return 'expired';
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

    -- Habilidade de inimigo que tira Fé: o cliente manda quanto cada alvo perdeu (o Mestre rolou o
    -- dado e o motor limitou ao que o personagem tinha). Quem passou no TR não perde Fé.
    v_faith := null;
    if v_result ? 'faithLost' then
      begin
        v_faith := (v_result ->> 'faithLost')::integer;
      exception when others then
        raise exception 'Fé perdida inválida' using errcode = '22023';
      end;
      if v_faith is null or v_faith < 0 or v_faith > 100 then
        raise exception 'Fé perdida inválida' using errcode = '22023';
      end if;
      if not v_failed then
        v_faith := 0;
      end if;
    end if;

    -- Os parênteses importam: `array || objeto || objeto` junta o segundo como elemento novo.
    v_final := v_final || (jsonb_build_object(
      'participantId', v_target_id,
      'name', v_stored ->> 'name',
      'conditions', v_conditions,
      'natural', v_result -> 'natural',
      'total', v_result -> 'total',
      'failed', v_failed,
      'mode', coalesce(v_result ->> 'mode', 'normal')
    ) || case when v_faith is null then '{}'::jsonb else jsonb_build_object('faithLost', v_faith) end);
  end loop;

  update public.combat_ability_uses
  set targets = v_final, status = 'resolved'
  where id = v_use.id;
  return 'resolved';
end;
$$;

revoke execute on function public.resolve_ability_use(uuid, jsonb) from public, anon;
