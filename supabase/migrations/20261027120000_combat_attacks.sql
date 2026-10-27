-- Ataque físico (Onda 5, feature 2; ADR 0005): o jogador ataca pelo app e o dano sai do PV do alvo,
-- que pode ser inimigo, NPC ou aliado. Só o Mestre altera `combat_participants`, então o ataque
-- passa por `apply_attack`: uma função SECURITY DEFINER que confere quem pode gravar, aplica o dano
-- de forma atômica e registra o ataque em `combat_attacks`.
--
-- A conta (acerto, crítico, dano) fica no motor do cliente (ADR 0004): a função recebe o resultado
-- pronto e só valida que o chamador é o dono do atacante, que é o turno dele e que o alvo está no
-- mesmo combate. O dano parte do PV que o banco guarda agora (nunca o do cliente), então dois
-- ataques seguidos somam.

create table public.combat_attacks (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references public.combats (id) on delete cascade,
  attacker_participant_id uuid not null references public.combat_participants (id) on delete cascade,
  target_participant_id uuid not null references public.combat_participants (id) on delete cascade,
  attacker_name text not null,
  target_name text not null,
  natural_roll integer not null check (natural_roll between 1 and 20),
  total integer not null,
  target_ac integer not null,
  hit boolean not null,
  critical boolean not null,
  fumble boolean not null,
  damage integer not null default 0 check (damage >= 0),
  target_hp_before integer not null,
  target_hp_after integer not null,
  -- A modalidade que valeu (Condições e Inspiração) e os dois d20 da Rolagem Virtual, se houve.
  applied_mode text not null default 'normal' check (applied_mode in ('normal', 'vantagem', 'desvantagem')),
  rolls integer[],
  inspiration_used boolean not null default false,
  -- O efeito de arma (natural 18 ou mais): se disparou e as Condições que chegaram ao alvo depois da
  -- Resistência a Condição (vazio se foi anulado).
  weapon_effect_triggered boolean not null default false,
  weapon_effect_conditions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.combat_attacks enable row level security;

create policy "Session members can view combat attacks"
  on public.combat_attacks for select to authenticated
  using (
    exists (
      select 1 from public.combats c
      where c.id = combat_attacks.combat_id
        and (public.is_session_gm(c.session_id) or public.is_session_participant(c.session_id))
    )
  );

-- Sem política de escrita: ninguém grava direto, só a função (que roda com os privilégios do dono).
revoke insert, update, delete, truncate on public.combat_attacks from anon, authenticated;
revoke all on public.combat_attacks from anon;

create or replace function public.apply_attack(
  p_attacker_participant_id uuid,
  p_target_participant_id uuid,
  p_natural_roll integer,
  p_total integer,
  p_target_ac integer,
  p_hit boolean,
  p_critical boolean,
  p_fumble boolean,
  p_damage integer,
  p_applied_mode text default 'normal',
  p_rolls integer[] default null,
  p_inspiration_used boolean default false,
  p_weapon_effect_triggered boolean default false,
  p_conditions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_attacker public.combat_participants%rowtype;
  v_target public.combat_participants%rowtype;
  v_combat public.combats%rowtype;
  v_count integer;
  v_current_id uuid;
  v_before integer;
  v_after integer;
  v_damage integer;
  v_conditions jsonb;
  v_attack_id uuid;
begin
  select * into v_attacker from public.combat_participants where id = p_attacker_participant_id;
  if not found then
    raise exception 'Atacante não encontrado' using errcode = '42501';
  end if;

  select * into v_combat from public.combats where id = v_attacker.combat_id;
  if v_combat.status <> 'active' then
    raise exception 'O combate não está ativo' using errcode = '42501';
  end if;

  -- Só o dono do personagem ataca por ele.
  if v_attacker.entity_type <> 'player'
     or not exists (
       select 1 from public.characters c
       where c.id = v_attacker.entity_id and c.user_id = auth.uid()
     ) then
    raise exception 'Apenas o dono do personagem ataca por ele' using errcode = '42501';
  end if;

  -- Quem está a 0 PV (Morrendo) não ataca, e ninguém ataca a si mesmo.
  if v_attacker.hp_current <= 0 then
    raise exception 'Quem está a 0 PV não ataca' using errcode = '42501';
  end if;
  if p_target_participant_id = v_attacker.id then
    raise exception 'O atacante não pode ser o próprio alvo' using errcode = '42501';
  end if;

  -- Só no próprio turno: a ordem é a da iniciativa (maior primeiro), como a tela a monta.
  select count(*) into v_count from public.combat_participants where combat_id = v_combat.id;
  select id into v_current_id
  from public.combat_participants
  where combat_id = v_combat.id
  order by initiative desc, created_at, id
  offset (v_combat.current_turn_index % v_count) limit 1;
  if v_current_id is distinct from v_attacker.id then
    raise exception 'Não é o turno do atacante' using errcode = '42501';
  end if;

  select * into v_target
  from public.combat_participants
  where id = p_target_participant_id and combat_id = v_combat.id
  for update;
  if not found then
    raise exception 'O alvo não está neste combate' using errcode = '42501';
  end if;

  v_before := v_target.hp_current;
  v_damage := case when p_hit then greatest(0, p_damage) else 0 end;
  v_after := greatest(0, v_before - v_damage);
  -- As Condições do efeito de arma entram só no acerto; uma Condição que o alvo já tem é trocada
  -- (a duração reinicia) e vai para o fim, como `mergeCondition` no cliente.
  v_conditions := case when p_hit and p_weapon_effect_triggered then p_conditions else '[]'::jsonb end;
  if v_damage > 0 or jsonb_array_length(v_conditions) > 0 then
    update public.combat_participants
    set hp_current = v_after,
        conditions = coalesce(
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

  insert into public.combat_attacks (
    combat_id, attacker_participant_id, target_participant_id, attacker_name, target_name,
    natural_roll, total, target_ac, hit, critical, fumble, damage, target_hp_before, target_hp_after,
    applied_mode, rolls, inspiration_used, weapon_effect_triggered, weapon_effect_conditions
  ) values (
    v_combat.id, v_attacker.id, v_target.id,
    coalesce(
      (select name from public.characters where id = v_attacker.entity_id),
      (select name from public.session_npcs where id = v_attacker.entity_id),
      'Desconhecido'
    ),
    coalesce(
      (select name from public.characters where id = v_target.entity_id),
      (select name from public.session_npcs where id = v_target.entity_id),
      'Desconhecido'
    ),
    p_natural_roll, p_total, p_target_ac, p_hit, p_critical, p_fumble, v_damage, v_before, v_after,
    p_applied_mode, p_rolls, p_inspiration_used, p_hit and p_weapon_effect_triggered, v_conditions
  )
  returning id into v_attack_id;

  return v_attack_id;
end;
$$;

revoke execute on function public.apply_attack(uuid, uuid, integer, integer, integer, boolean, boolean, boolean, integer, text, integer[], boolean, boolean, jsonb) from public, anon;

-- Realtime: a mesa recebe cada ataque na hora (aviso do Mestre, lista de ataques). O bloco é
-- idempotente.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'combat_attacks'
  ) then
    alter publication supabase_realtime add table public.combat_attacks;
  end if;
end
$$;
