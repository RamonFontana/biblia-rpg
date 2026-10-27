-- Efeito de Habilidade (Onda 5, feature 4; ADR 0007): o jogador usa uma Habilidade que aplica
-- Condição, e só o Mestre altera `combat_participants`. O uso passa por `record_ability_use`: uma
-- função SECURITY DEFINER que confere quem pode gravar, aplica as Condições de forma atômica e
-- registra o uso em `combat_ability_uses`, ao lado dos ataques.
--
-- A conta (Resistência a Condição, imunidades, duração) fica no motor do cliente (ADR 0004): a
-- função recebe as Condições que chegam a cada alvo e só valida que o chamador é o dono do
-- usuário, que o combate está ativo, que é o turno dele (Ação e Ação Bônus; a Reação vale a
-- qualquer momento) e que os alvos estão no mesmo combate. `status` e `cd` ficam para o uso com
-- TR, que espera o Mestre lançar os testes.

create table public.combat_ability_uses (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references public.combats (id) on delete cascade,
  user_participant_id uuid not null references public.combat_participants (id) on delete cascade,
  user_name text not null,
  ability_id text not null,
  ability_name text not null,
  action_type text not null check (action_type in ('action', 'bonus_action', 'reaction', 'free_action')),
  status text not null default 'applied' check (status in ('applied', 'pending', 'resolved', 'expired')),
  cd integer,
  -- Por alvo: o participante, o nome e as Condições que chegaram (vazio se foram anuladas).
  targets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.combat_ability_uses enable row level security;

create policy "Session members can view combat ability uses"
  on public.combat_ability_uses for select to authenticated
  using (
    exists (
      select 1 from public.combats c
      where c.id = combat_ability_uses.combat_id
        and (public.is_session_gm(c.session_id) or public.is_session_participant(c.session_id))
    )
  );

-- Sem política de escrita: ninguém grava direto, só a função (que roda com os privilégios do dono).
revoke insert, update, delete, truncate on public.combat_ability_uses from anon, authenticated;
revoke all on public.combat_ability_uses from anon;

create or replace function public.record_ability_use(
  p_user_participant_id uuid,
  p_ability_id text,
  p_ability_name text,
  p_action_type text,
  p_targets jsonb
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
begin
  if p_targets is null or jsonb_typeof(p_targets) <> 'array' or jsonb_array_length(p_targets) = 0 then
    raise exception 'Escolha ao menos um alvo' using errcode = '22023';
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

    v_conditions := coalesce(v_entry -> 'conditions', '[]'::jsonb);
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
    combat_id, user_participant_id, user_name, ability_id, ability_name, action_type, targets
  ) values (
    v_combat.id, v_user.id,
    coalesce(
      (select name from public.characters where id = v_user.entity_id),
      'Desconhecido'
    ),
    p_ability_id, p_ability_name, p_action_type, v_results
  )
  returning id into v_use_id;

  return v_use_id;
end;
$$;

revoke execute on function public.record_ability_use(uuid, text, text, text, jsonb) from public, anon;

-- Realtime: a mesa recebe cada uso na hora (o histórico do combate). O bloco é idempotente.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'combat_ability_uses'
  ) then
    alter publication supabase_realtime add table public.combat_ability_uses;
  end if;
end
$$;
