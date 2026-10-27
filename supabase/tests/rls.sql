-- Testes de comportamento do RLS e das funções, por papel (anon, jogador, outro jogador, Mestre,
-- estranho). Rodam num Postgres descartável com todas as migrations aplicadas:
--   npm run test:rls-db
-- Cada ação roda numa subtransação que é desfeita, então os dados de apoio não mudam entre testes.
-- Quem pode escrever é o que o RLS garante; as regras do jogo ficam no motor (ADR 0004).

create or replace function pg_temp.claims(uid uuid) returns void language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    case when uid is null then '{"role":"anon"}'
         else json_build_object('sub', uid, 'role', 'authenticated')::text end,
    true);
  -- A imagem local lê as configurações antigas (request.jwt.claim.*); o Supabase hospedado lê os claims.
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  perform set_config('request.jwt.claim.role', case when uid is null then 'anon' else 'authenticated' end, true);
end $$;

-- Executa `stmt` como o usuário e devolve 'rows=N' ou 'error=SQLSTATE'; desfaz tudo.
create or replace function pg_temp.run_as(uid uuid, stmt text) returns text language plpgsql as $$
declare n bigint;
begin
  perform pg_temp.claims(uid);
  begin
    execute format('set local role %s', case when uid is null then 'anon' else 'authenticated' end);
    execute stmt;
    get diagnostics n = row_count;
    raise exception 'rolled_back';
  exception when others then
    if sqlerrm = 'rolled_back' then return 'rows=' || n; end if;
    return 'error=' || sqlstate;
  end;
end $$;

-- Como run_as, mas devolve o primeiro valor da consulta (texto).
create or replace function pg_temp.val_as(uid uuid, stmt text) returns text language plpgsql as $$
declare v text;
begin
  perform pg_temp.claims(uid);
  begin
    execute format('set local role %s', case when uid is null then 'anon' else 'authenticated' end);
    execute stmt into v;
    raise exception 'rolled_back';
  exception when others then
    if sqlerrm = 'rolled_back' then return coalesce(v, 'NULL'); end if;
    return 'error=' || sqlstate;
  end;
end $$;

-- Executa os `stmts` como o usuário (em ordem) e devolve o primeiro valor de `probe` (texto) lido
-- logo depois, ainda como o usuário; desfaz tudo. Um erro em qualquer passo vira 'error=SQLSTATE'.
create or replace function pg_temp.after_as(uid uuid, stmts text[], probe text) returns text language plpgsql as $$
declare v text; s text;
begin
  perform pg_temp.claims(uid);
  begin
    execute format('set local role %s', case when uid is null then 'anon' else 'authenticated' end);
    foreach s in array stmts loop execute s; end loop;
    execute probe into v;
    raise exception 'rolled_back';
  exception when others then
    if sqlerrm = 'rolled_back' then return coalesce(v, 'NULL'); end if;
    return 'error=' || sqlstate;
  end;
end $$;

-- Como after_as, mas cada passo roda como um usuário (`uids[i]` executa `stmts[i]`; nulo = anon), em
-- ordem, e `probe` lê como superusuário o primeiro valor (texto). Serve a fluxos de vários jogadores.
create or replace function pg_temp.seq_as(uids uuid[], stmts text[], probe text) returns text language plpgsql as $$
declare v text; i int;
begin
  begin
    for i in 1 .. array_length(stmts, 1) loop
      perform pg_temp.claims(uids[i]);
      execute format('set local role %s', case when uids[i] is null then 'anon' else 'authenticated' end);
      execute stmts[i];
      reset role;
    end loop;
    reset role;
    execute probe into v;
    raise exception 'rolled_back';
  exception when others then
    if sqlerrm = 'rolled_back' then return coalesce(v, 'NULL'); end if;
    return 'error=' || sqlstate;
  end;
end $$;

-- Dados de apoio (como superusuário).
insert into auth.users (id, instance_id, aud, role, email) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gm@test'),
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice@test'),
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@test'),
  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carol@test'),
  ('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dave@test');

create temp table who as
  select '11111111-0000-0000-0000-000000000001'::uuid as gm,
         '11111111-0000-0000-0000-000000000002'::uuid as alice,
         '11111111-0000-0000-0000-000000000003'::uuid as bob,
         '11111111-0000-0000-0000-000000000004'::uuid as carol,
         '11111111-0000-0000-0000-000000000005'::uuid as dave;
grant select on who to anon, authenticated;

insert into public.game_sessions (id, name, gm_id, status) values
  ('22222222-0000-0000-0000-000000000001', 'S1 ativa', (select gm from who), 'active'),
  ('22222222-0000-0000-0000-000000000002', 'S2 de outro Mestre', (select carol from who), 'active');

insert into public.characters (id, user_id, name, tribe, vocation, attributes, stats, is_npc) values
  ('33333333-0000-0000-0000-000000000001', (select alice from who), 'Alice', 'Judá', 'Guerreiro', '{}', '{}', false),
  ('33333333-0000-0000-0000-000000000002', (select bob from who), 'Bob', 'Dã', 'Batedor', '{}', '{}', false),
  ('33333333-0000-0000-0000-000000000003', (select carol from who), 'Carol', 'Levi', 'Sacerdote', '{}', '{}', false),
  ('33333333-0000-0000-0000-000000000004', (select gm from who), 'NPC do Mestre', 'Judá', 'Guerreiro', '{}', '{}', true),
  ('33333333-0000-0000-0000-000000000005', (select dave from who), 'Dave', 'Gad', 'Caçador', '{}', '{}', false);

insert into public.session_participants (session_id, character_id, user_id) values
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', (select alice from who)),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', (select bob from who)),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', (select gm from who)),
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000005', (select dave from who));

-- Os itens vêm do seed das migrations; só fixamos os ids para os testes.
update public.items set id = '44444444-0000-0000-0000-000000000001' where slug = 'espada_curta';
update public.items set id = '44444444-0000-0000-0000-000000000002' where slug = 'balsamo';

insert into public.character_items (id, character_id, item_id, quantity) values
  ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 1),
  ('55555555-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', 2),
  ('55555555-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000001', 1);

insert into public.session_tests (id, session_id, test_type, difficulty) values
  ('66666666-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Fé', 10);

insert into public.session_test_results (id, test_id, character_id, player_id) values
  ('77777777-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', (select alice from who)),
  ('77777777-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', (select bob from who));

insert into public.trades (id, session_id, type, status, initiator_user_id, initiator_character_id, target_character_id, initiator_ready, target_ready) values
  ('88888888-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'player_trade', 'active', (select alice from who), '33333333-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', true, true);
insert into public.trade_items (trade_id, side, item_id, quantity) values
  ('88888888-0000-0000-0000-000000000001', 'initiator', '44444444-0000-0000-0000-000000000001', 1);

-- Combates de apoio para o ataque (apply_attack): C1 ativo, turno 0 (Alice); C2 ativo, turno 1
-- (Bob); C3 encerrado; C4 de outra sessão.
insert into public.combats (id, session_id, status, current_turn_index) values
  ('99999999-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active', 0),
  ('99999999-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'active', 1),
  ('99999999-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'finished', 0),
  ('99999999-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'active', 0),
  ('99999999-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'active', 0);
insert into public.combat_participants (id, combat_id, entity_id, entity_type, initiative, hp_current) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'player', 20, 15),
  ('aaaaaaaa-0000-0000-0000-000000000002', '99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'player', 15, 20),
  ('aaaaaaaa-0000-0000-0000-000000000003', '99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', 'npc', 10, 12),
  ('aaaaaaaa-0000-0000-0000-000000000004', '99999999-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'player', 20, 15),
  ('aaaaaaaa-0000-0000-0000-000000000005', '99999999-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'player', 15, 20),
  ('aaaaaaaa-0000-0000-0000-000000000006', '99999999-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000001', 'player', 20, 15),
  ('aaaaaaaa-0000-0000-0000-000000000007', '99999999-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000002', 'player', 15, 20),
  ('aaaaaaaa-0000-0000-0000-000000000008', '99999999-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000003', 'player', 20, 10),
  ('aaaaaaaa-0000-0000-0000-000000000009', '99999999-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000001', 'player', 20, 0),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '99999999-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', 'player', 15, 20);

-- Sessões de apoio para o Descanso Curto (open_short_rest / close_short_rest): S3 sem combate e sem
-- descanso aberto; S4 com um descanso aberto, um pedido e um "terminei". Dave é jogador nas duas.
insert into public.game_sessions (id, name, gm_id, status) values
  ('22222222-0000-0000-0000-000000000003', 'S3 sem combate', (select gm from who), 'active');
insert into public.game_sessions (id, name, gm_id, status, short_rests_today, short_rest_id, short_rest_opened_by, short_rest_requested, short_rest_finished) values
  ('22222222-0000-0000-0000-000000000004', 'S4 com descanso aberto', (select gm from who), 'active', 1,
   'bbbbbbbb-0000-0000-0000-000000000001', 'group',
   array['33333333-0000-0000-0000-000000000005'::uuid], array['33333333-0000-0000-0000-000000000005'::uuid]);
insert into public.session_participants (session_id, character_id, user_id) values
  ('22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000005', (select dave from who)),
  ('22222222-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000005', (select dave from who));

-- Sessões de apoio para o Pedido de Descanso. S5: pedidos abertos a todos, com um NPC, um inimigo e
-- um personagem Morto que não contam no "todos". S6: descanso aberto pelo grupo, para o "Terminei".
-- S7: sem Descanso Curto restante no dia.
insert into public.characters (id, user_id, name, tribe, vocation, attributes, stats, is_npc, is_enemy, is_dead) values
  ('33333333-0000-0000-0000-000000000006', (select carol from who), 'Caleb', 'Levi', 'Sacerdote', '{}', '{}', false, false, true),
  ('33333333-0000-0000-0000-000000000007', (select gm from who), 'Orc', '', '', '{}', '{}', false, true, false);
insert into public.game_sessions (id, name, gm_id, status, short_rests_today) values
  ('22222222-0000-0000-0000-000000000005', 'S5 pedidos', (select gm from who), 'active', 0),
  ('22222222-0000-0000-0000-000000000007', 'S7 sem restante', (select gm from who), 'active', 2);
insert into public.game_sessions (id, name, gm_id, status, short_rests_today, short_rest_id, short_rest_opened_by) values
  ('22222222-0000-0000-0000-000000000006', 'S6 aberto pelo grupo', (select gm from who), 'active', 1,
   'bbbbbbbb-0000-0000-0000-000000000002', 'group');
insert into public.session_participants (session_id, character_id, user_id) values
  ('22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000001', (select alice from who)),
  ('22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', (select bob from who)),
  ('22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000004', (select gm from who)),
  ('22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000006', (select carol from who)),
  ('22222222-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000007', (select gm from who)),
  ('22222222-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000001', (select alice from who)),
  ('22222222-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000002', (select bob from who)),
  ('22222222-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000006', (select carol from who)),
  ('22222222-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000001', (select alice from who));

create temp table results (name text, actual text, expected text);

-- uid helpers para ler legível
create or replace function pg_temp.t(name text, actual text, expected text) returns void language sql as
  $$ insert into results values (name, actual, expected) $$;

-- ======================= session_tests =======================
select pg_temp.t('session_tests: anon não lê',            pg_temp.run_as(null, 'select * from public.session_tests'), 'rows=0');
select pg_temp.t('session_tests: estranho não lê',        pg_temp.run_as((select carol from who), 'select * from public.session_tests'), 'rows=0');
select pg_temp.t('session_tests: jogador da sessão lê',   pg_temp.run_as((select alice from who), 'select * from public.session_tests'), 'rows=1');
select pg_temp.t('session_tests: Mestre lê',              pg_temp.run_as((select gm from who), 'select * from public.session_tests'), 'rows=1');
select pg_temp.t('session_tests: anon não cria',          pg_temp.run_as(null, $q$insert into public.session_tests (session_id, test_type, difficulty) values ('22222222-0000-0000-0000-000000000001','Fé',5)$q$), 'error=42501');
select pg_temp.t('session_tests: estranho não cria',      pg_temp.run_as((select carol from who), $q$insert into public.session_tests (session_id, test_type, difficulty) values ('22222222-0000-0000-0000-000000000001','Fé',5)$q$), 'error=42501');
select pg_temp.t('session_tests: jogador não cria',       pg_temp.run_as((select alice from who), $q$insert into public.session_tests (session_id, test_type, difficulty) values ('22222222-0000-0000-0000-000000000001','Fé',5)$q$), 'error=42501');
select pg_temp.t('session_tests: Mestre cria',            pg_temp.run_as((select gm from who), $q$insert into public.session_tests (session_id, test_type, difficulty) values ('22222222-0000-0000-0000-000000000001','Fé',5)$q$), 'rows=1');
select pg_temp.t('session_tests: Mestre cria com o uso e o Pedido Egoísta', pg_temp.val_as((select gm from who), $q$insert into public.session_tests (session_id, test_type, difficulty, faith_use, selfish_request) values ('22222222-0000-0000-0000-000000000001','Fé',-20,'clamor',true) returning faith_use || '/' || selfish_request$q$), 'clamor/true');
select pg_temp.t('session_tests: sem uso nem marca, o padrão é nulo e falso', pg_temp.val_as((select gm from who), $q$insert into public.session_tests (session_id, test_type, difficulty) values ('22222222-0000-0000-0000-000000000001','Força',10) returning coalesce(faith_use, 'nulo') || '/' || selfish_request$q$), 'nulo/false');
select pg_temp.t('session_tests: o banco recusa um uso desconhecido', pg_temp.run_as((select gm from who), $q$insert into public.session_tests (session_id, test_type, difficulty, faith_use) values ('22222222-0000-0000-0000-000000000001','Fé',5,'blasfemia')$q$), 'error=23514');
select pg_temp.t('session_tests: jogador não cria pedido com o uso', pg_temp.run_as((select alice from who), $q$insert into public.session_tests (session_id, test_type, difficulty, faith_use) values ('22222222-0000-0000-0000-000000000001','Fé',5,'clamor')$q$), 'error=42501');
select pg_temp.t('session_tests: Mestre de outra sessão não cria aqui', pg_temp.run_as((select carol from who), $q$insert into public.session_tests (session_id, test_type, difficulty) values ('22222222-0000-0000-0000-000000000001','Fé',5)$q$), 'error=42501');
select pg_temp.t('session_tests: jogador não altera',     pg_temp.run_as((select alice from who), $q$update public.session_tests set status = 'cancelled'$q$), 'rows=0');
select pg_temp.t('session_tests: anon não altera',        pg_temp.run_as(null, $q$update public.session_tests set status = 'cancelled'$q$), 'rows=0');
select pg_temp.t('session_tests: Mestre altera',          pg_temp.run_as((select gm from who), $q$update public.session_tests set status = 'cancelled'$q$), 'rows=1');

-- ==================== session_test_results ====================
select pg_temp.t('results: anon não lê',                  pg_temp.run_as(null, 'select * from public.session_test_results'), 'rows=0');
select pg_temp.t('results: estranho não lê',              pg_temp.run_as((select carol from who), 'select * from public.session_test_results'), 'rows=0');
select pg_temp.t('results: jogador da sessão lê',         pg_temp.run_as((select alice from who), 'select * from public.session_test_results'), 'rows=2');
select pg_temp.t('results: Mestre lê',                    pg_temp.run_as((select gm from who), 'select * from public.session_test_results'), 'rows=2');
select pg_temp.t('results: anon não cria',                pg_temp.run_as(null, $q$insert into public.session_test_results (test_id, character_id, player_id) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002')$q$), 'error=42501');
select pg_temp.t('results: jogador não cria',             pg_temp.run_as((select alice from who), $q$insert into public.session_test_results (test_id, character_id, player_id) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002')$q$), 'error=42501');
select pg_temp.t('results: estranho não cria',            pg_temp.run_as((select carol from who), $q$insert into public.session_test_results (test_id, character_id, player_id) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('results: Mestre cria',                  pg_temp.run_as((select gm from who), $q$insert into public.session_test_results (test_id, character_id, player_id) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002')$q$), 'rows=1');
select pg_temp.t('results: dono grava o próprio resultado', pg_temp.run_as((select alice from who), $q$update public.session_test_results set status='submitted', result_value=7, is_approved=true where id='77777777-0000-0000-0000-000000000001'$q$), 'rows=1');
select pg_temp.t('results: jogador não grava o de outro', pg_temp.run_as((select alice from who), $q$update public.session_test_results set status='submitted' where id='77777777-0000-0000-0000-000000000002'$q$), 'rows=0');
select pg_temp.t('results: estranho não grava',           pg_temp.run_as((select carol from who), $q$update public.session_test_results set status='submitted'$q$), 'rows=0');
select pg_temp.t('results: anon não grava',               pg_temp.run_as(null, $q$update public.session_test_results set status='submitted'$q$), 'rows=0');
select pg_temp.t('results: Mestre grava',                 pg_temp.run_as((select gm from who), $q$update public.session_test_results set status='submitted' where id='77777777-0000-0000-0000-000000000002'$q$), 'rows=1');
select pg_temp.t('results: Mestre cria com a marca de Vantagem', pg_temp.val_as((select gm from who), $q$insert into public.session_test_results (test_id, character_id, player_id, master_mark) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','vantagem') returning master_mark$q$), 'vantagem');
select pg_temp.t('results: sem marca, o Teste é normal (nulo)', pg_temp.val_as((select gm from who), $q$insert into public.session_test_results (test_id, character_id, player_id) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002') returning coalesce(master_mark, 'nulo')$q$), 'nulo');
select pg_temp.t('results: o banco recusa uma marca desconhecida', pg_temp.run_as((select gm from who), $q$insert into public.session_test_results (test_id, character_id, player_id, master_mark) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','sorte')$q$), 'error=23514');
select pg_temp.t('results: jogador não cria com a marca', pg_temp.run_as((select alice from who), $q$insert into public.session_test_results (test_id, character_id, player_id, master_mark) values ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','vantagem')$q$), 'error=42501');
select pg_temp.t('results: dono grava a modalidade e os dois dados', pg_temp.val_as((select alice from who), $q$update public.session_test_results set status='submitted', result_value=31, applied_mode='vantagem', roll_values=array[64,31] where id='77777777-0000-0000-0000-000000000001' returning applied_mode || '/' || roll_values::text$q$), 'vantagem/{64,31}');
select pg_temp.t('results: o banco recusa uma modalidade desconhecida', pg_temp.run_as((select alice from who), $q$update public.session_test_results set applied_mode='sorte' where id='77777777-0000-0000-0000-000000000001'$q$), 'error=23514');
select pg_temp.t('results: dono não passa o resultado para outro jogador', pg_temp.run_as((select alice from who), $q$update public.session_test_results set player_id='11111111-0000-0000-0000-000000000003' where id='77777777-0000-0000-0000-000000000001'$q$), 'error=42501');

-- ======================== character_items ========================
select pg_temp.t('character_items: anon não lê',          pg_temp.run_as(null, 'select * from public.character_items'), 'rows=0');
select pg_temp.t('character_items: logado lê',            pg_temp.run_as((select carol from who), 'select * from public.character_items'), 'rows=3');
select pg_temp.t('character_items: dono cria no próprio', pg_temp.run_as((select alice from who), $q$insert into public.character_items (character_id, item_id, level) values ('33333333-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002', 1)$q$), 'rows=1');
select pg_temp.t('character_items: jogador não cria no de outro', pg_temp.run_as((select alice from who), $q$insert into public.character_items (character_id, item_id, level) values ('33333333-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000001', 1)$q$), 'error=42501');
select pg_temp.t('character_items: estranho não cria',    pg_temp.run_as((select carol from who), $q$insert into public.character_items (character_id, item_id, level) values ('33333333-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002', 1)$q$), 'error=42501');
select pg_temp.t('character_items: anon não cria',        pg_temp.run_as(null, $q$insert into public.character_items (character_id, item_id, level) values ('33333333-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002', 1)$q$), 'error=42501');
select pg_temp.t('character_items: Mestre da sessão cria no de jogador', pg_temp.run_as((select gm from who), $q$insert into public.character_items (character_id, item_id, level) values ('33333333-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002', 1)$q$), 'rows=1');
select pg_temp.t('character_items: Mestre não cria fora da sessão', pg_temp.run_as((select gm from who), $q$insert into public.character_items (character_id, item_id, level) values ('33333333-0000-0000-0000-000000000003','44444444-0000-0000-0000-000000000002', 1)$q$), 'error=42501');
select pg_temp.t('character_items: dono altera o próprio', pg_temp.run_as((select alice from who), $q$update public.character_items set quantity = 5 where id='55555555-0000-0000-0000-000000000001'$q$), 'rows=1');
select pg_temp.t('character_items: jogador não altera o de outro', pg_temp.run_as((select alice from who), $q$update public.character_items set quantity = 5 where id='55555555-0000-0000-0000-000000000002'$q$), 'rows=0');
select pg_temp.t('character_items: estranho não altera', pg_temp.run_as((select carol from who), $q$update public.character_items set quantity = 5$q$), 'rows=0');
select pg_temp.t('character_items: anon não altera',     pg_temp.run_as(null, $q$update public.character_items set quantity = 5$q$), 'rows=0');
select pg_temp.t('character_items: Mestre altera os da sessão (jogadores e NPC)', pg_temp.run_as((select gm from who), $q$update public.character_items set quantity = 5$q$), 'rows=3');
select pg_temp.t('character_items: dono apaga o próprio', pg_temp.run_as((select alice from who), $q$delete from public.character_items where id='55555555-0000-0000-0000-000000000001'$q$), 'rows=1');
select pg_temp.t('character_items: jogador não apaga o de outro', pg_temp.run_as((select alice from who), $q$delete from public.character_items where id='55555555-0000-0000-0000-000000000002'$q$), 'rows=0');
select pg_temp.t('character_items: estranho não apaga',  pg_temp.run_as((select carol from who), 'delete from public.character_items'), 'rows=0');
select pg_temp.t('character_items: Mestre apaga os da sessão', pg_temp.run_as((select gm from who), 'delete from public.character_items'), 'rows=3');
select pg_temp.t('character_items: o dono não muda o item para outro personagem', pg_temp.run_as((select alice from who), $q$update public.character_items set character_id='33333333-0000-0000-0000-000000000002' where id='55555555-0000-0000-0000-000000000001'$q$), 'error=42501');

-- ============================= items =============================
select pg_temp.t('items: anon não lê',                    pg_temp.run_as(null, 'select * from public.items'), 'rows=0');
select pg_temp.t('items: logado lê',                      pg_temp.run_as((select alice from who), 'select * from public.items'), 'rows=35');
select pg_temp.t('items: logado não insere',              pg_temp.run_as((select alice from who), $q$insert into public.items (slug, name, category) values ('novo','Novo','Arma')$q$), 'error=42501');
select pg_temp.t('items: Mestre não insere',              pg_temp.run_as((select gm from who), $q$insert into public.items (slug, name, category) values ('novo','Novo','Arma')$q$), 'error=42501');

-- ====== o que não mudou: sessões, personagens, participantes, combates ======
select pg_temp.t('game_sessions: anon não lê (sem erro)',        pg_temp.run_as(null, 'select * from public.game_sessions'), 'rows=0');
select pg_temp.t('game_sessions: jogador lê só a sua sessão',     pg_temp.run_as((select alice from who), 'select * from public.game_sessions'), 'rows=4');
select pg_temp.t('game_sessions: Mestre lê a que criou',          pg_temp.run_as((select carol from who), 'select * from public.game_sessions'), 'rows=3');
select pg_temp.t('characters: logado lê todos',                  pg_temp.run_as((select carol from who), 'select * from public.characters'), 'rows=7');
select pg_temp.t('characters: anon não lê',                      pg_temp.run_as(null, 'select * from public.characters'), 'rows=0');
select pg_temp.t('characters: dono altera o próprio',            pg_temp.run_as((select alice from who), $q$update public.characters set name = 'A' where id='33333333-0000-0000-0000-000000000001'$q$), 'rows=1');
select pg_temp.t('characters: jogador não altera o de outro',    pg_temp.run_as((select alice from who), $q$update public.characters set name = 'A' where id='33333333-0000-0000-0000-000000000002'$q$), 'rows=0');
select pg_temp.t('characters: Mestre altera o participante da sessão ativa', pg_temp.run_as((select gm from who), $q$update public.characters set name = 'A' where id='33333333-0000-0000-0000-000000000001'$q$), 'rows=1');
select pg_temp.t('characters: Mestre não altera quem não está na sessão', pg_temp.run_as((select gm from who), $q$update public.characters set name = 'A' where id='33333333-0000-0000-0000-000000000003'$q$), 'rows=0');
-- As moedas são Siclos e os preços da loja chegam a 0,025 SP: a coluna guarda fração (passo 9d do ROADMAP).
select pg_temp.t('characters: dono grava o dia da Inspiração na própria ficha', pg_temp.val_as((select alice from who), $q$update public.characters set inspiration_used_day = 3, inspiration_session_id = '22222222-0000-0000-0000-000000000001' where id='33333333-0000-0000-0000-000000000001' returning inspiration_used_day::text$q$), '3');
select pg_temp.t('characters: estranho não grava o dia da Inspiração', pg_temp.run_as((select carol from who), $q$update public.characters set inspiration_used_day = 3 where id='33333333-0000-0000-0000-000000000001'$q$), 'rows=0');
select pg_temp.t('characters: Inspiração nunca usada é nula', pg_temp.val_as((select alice from who), $q$select coalesce(inspiration_used_day::text, 'nulo') from public.characters where id='33333333-0000-0000-0000-000000000002'$q$), 'nulo');
select pg_temp.t('results: dono grava a Inspiração usada no próprio resultado', pg_temp.val_as((select alice from who), $q$update public.session_test_results set inspiration_used = true where id='77777777-0000-0000-0000-000000000001' returning inspiration_used::text$q$), 'true');
select pg_temp.t('results: a Inspiração usada começa falsa', pg_temp.val_as((select gm from who), $q$select inspiration_used::text from public.session_test_results where id='77777777-0000-0000-0000-000000000002'$q$), 'false');
select pg_temp.t('characters: moedas guardam Siclos fracionados', pg_temp.val_as((select alice from who), $q$update public.characters set coins = 49.975 where id='33333333-0000-0000-0000-000000000001' returning coins$q$), '49.975');
select pg_temp.t('session_participants: Mestre adiciona',        pg_temp.run_as((select gm from who), $q$insert into public.session_participants (session_id, character_id, user_id) values ('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000004')$q$), 'rows=1');
select pg_temp.t('session_participants: jogador não adiciona',   pg_temp.run_as((select alice from who), $q$insert into public.session_participants (session_id, character_id, user_id) values ('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('combats: Mestre cria',                         pg_temp.run_as((select gm from who), $q$insert into public.combats (session_id) values ('22222222-0000-0000-0000-000000000001')$q$), 'rows=1');
select pg_temp.t('combats: jogador não cria',                    pg_temp.run_as((select alice from who), $q$insert into public.combats (session_id) values ('22222222-0000-0000-0000-000000000001')$q$), 'error=42501');

-- ============================== trades ==============================
select pg_temp.t('trades: anon não cria',                 pg_temp.run_as(null, $q$insert into public.trades (session_id, type, initiator_user_id, initiator_character_id) values ('22222222-0000-0000-0000-000000000001','player_trade','11111111-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('trades: estranho à sessão não cria',    pg_temp.run_as((select carol from who), $q$insert into public.trades (session_id, type, initiator_user_id, initiator_character_id) values ('22222222-0000-0000-0000-000000000001','player_trade','11111111-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000003')$q$), 'error=42501');
select pg_temp.t('trades: jogador cria a própria troca',  pg_temp.run_as((select alice from who), $q$insert into public.trades (session_id, type, initiator_user_id, initiator_character_id, target_character_id) values ('22222222-0000-0000-0000-000000000001','player_trade','11111111-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000002')$q$), 'rows=1');
select pg_temp.t('trades: jogador não cria em nome de outro usuário', pg_temp.run_as((select alice from who), $q$insert into public.trades (session_id, type, initiator_user_id, initiator_character_id, target_character_id) values ('22222222-0000-0000-0000-000000000001','player_trade','11111111-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('trades: jogador não usa o personagem de outro como iniciador', pg_temp.run_as((select alice from who), $q$insert into public.trades (session_id, type, initiator_user_id, initiator_character_id, target_character_id) values ('22222222-0000-0000-0000-000000000001','player_trade','11111111-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('trades: o Mestre inicia troca de loja sem personagem', pg_temp.run_as((select gm from who), $q$insert into public.trades (session_id, type, initiator_user_id, target_character_id) values ('22222222-0000-0000-0000-000000000001','shop','11111111-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001')$q$), 'rows=1');

-- ============================ funções ============================
select pg_temp.t('add_kit_to_character foi apagada',      pg_temp.val_as((select gm from who), $q$select to_regprocedure('public.add_kit_to_character(uuid,uuid)')::text$q$), 'NULL');
select pg_temp.t('rls_auto_enable: anon não executa',     pg_temp.val_as(null, $q$select has_function_privilege('anon','public.rls_auto_enable()','execute')::text$q$), 'false');
select pg_temp.t('rls_auto_enable: logado não executa',   pg_temp.val_as(null, $q$select has_function_privilege('authenticated','public.rls_auto_enable()','execute')::text$q$), 'false');
do $$
declare enabled boolean;
begin
  begin
    create table public._rls_probe (id int);
    select relrowsecurity into enabled from pg_class where oid = 'public._rls_probe'::regclass;
    raise exception 'rolled_back';
  exception when others then null;
  end;
  insert into results values ('rls_auto_enable ainda liga o RLS numa tabela nova', coalesce(enabled::text, 'NULL'), 'true');
end $$;

select pg_temp.t('is_session_gm: anon não executa',       pg_temp.val_as(null, $q$select has_function_privilege('anon','public.is_session_gm(uuid)','execute')::text$q$), 'false');
select pg_temp.t('is_session_gm: logado executa (políticas)', pg_temp.val_as(null, $q$select has_function_privilege('authenticated','public.is_session_gm(uuid)','execute')::text$q$), 'true');
select pg_temp.t('is_session_participant: anon não executa', pg_temp.val_as(null, $q$select has_function_privilege('anon','public.is_session_participant(uuid)','execute')::text$q$), 'false');
select pg_temp.t('is_trade_participant: anon não executa', pg_temp.val_as(null, $q$select has_function_privilege('anon','public.is_trade_participant(uuid)','execute')::text$q$), 'false');
select pg_temp.t('nenhuma política vale para o papel public (anon)', (select count(*)::text from pg_policies where schemaname='public' and roles = '{public}'), '0');
select pg_temp.t('anon não lê sessões (sem erro)',        pg_temp.run_as(null, 'select * from public.game_sessions'), 'rows=0');
select pg_temp.t('anon não lê trocas (sem erro)',         pg_temp.run_as(null, 'select * from public.trades'), 'rows=0');

select pg_temp.t('create_game_session: anon não executa', pg_temp.val_as(null, $q$select public.create_game_session('x','', '[]'::jsonb, '[]'::jsonb, '{}'::uuid[])::text$q$), 'error=42501');
do $$
declare sid uuid; gm uuid;
begin
  perform pg_temp.claims((select alice from who));
  begin
    set local role authenticated;
    sid := public.create_game_session('x', '', '[]'::jsonb, '[]'::jsonb, '{}'::uuid[]);
    reset role;
    select gm_id into gm from public.game_sessions where id = sid;
    raise exception 'rolled_back';
  exception when others then null;
  end;
  insert into results values ('create_game_session: logado cria e vira o Mestre', coalesce(gm::text, 'NULL'), '11111111-0000-0000-0000-000000000002');
end $$;

select pg_temp.t('execute_trade: anon não executa',       pg_temp.val_as(null, $q$select public.execute_trade('88888888-0000-0000-0000-000000000001')::text$q$), 'error=42501');
select pg_temp.t('execute_trade: estranho não executa',   pg_temp.val_as((select carol from who), $q$select public.execute_trade('88888888-0000-0000-0000-000000000001')::text$q$), 'error=42501');
select pg_temp.t('execute_trade: jogador da sessão fora da troca não executa', pg_temp.val_as((select dave from who), $q$select public.execute_trade('88888888-0000-0000-0000-000000000001')::text$q$), 'error=42501');
select pg_temp.t('execute_trade: quem iniciou executa',   pg_temp.val_as((select alice from who), $q$select public.execute_trade('88888888-0000-0000-0000-000000000001')::text$q$), '{"success": true}');
select pg_temp.t('execute_trade: o alvo executa',         pg_temp.val_as((select bob from who), $q$select public.execute_trade('88888888-0000-0000-0000-000000000001')::text$q$), '{"success": true}');
select pg_temp.t('execute_trade: o Mestre executa',       pg_temp.val_as((select gm from who), $q$select public.execute_trade('88888888-0000-0000-0000-000000000001')::text$q$), '{"success": true}');

select pg_temp.t('cancel_session_trades: anon não executa', pg_temp.val_as(null, $q$select public.cancel_session_trades('22222222-0000-0000-0000-000000000001')::text$q$), 'error=42501');
select pg_temp.t('cancel_session_trades: jogador não cancela', pg_temp.val_as((select alice from who), $q$select public.cancel_session_trades('22222222-0000-0000-0000-000000000001')::text$q$), 'error=42501');
select pg_temp.t('cancel_session_trades: Mestre de outra sessão não cancela', pg_temp.val_as((select carol from who), $q$select public.cancel_session_trades('22222222-0000-0000-0000-000000000001')::text$q$), 'error=42501');
select pg_temp.t('cancel_session_trades: o Mestre cancela', pg_temp.val_as((select gm from who), $q$select public.cancel_session_trades('22222222-0000-0000-0000-000000000001')::text$q$), '');

select pg_temp.t('use_consumable_item: anon não executa', pg_temp.val_as(null, $q$select public.use_consumable_item('55555555-0000-0000-0000-000000000002')::text$q$), 'error=42501');
select pg_temp.t('use_consumable_item: estranho não usa', pg_temp.val_as((select carol from who), $q$select public.use_consumable_item('55555555-0000-0000-0000-000000000002')::text$q$), 'error=42501');
select pg_temp.t('use_consumable_item: outro jogador não usa', pg_temp.val_as((select alice from who), $q$select public.use_consumable_item('55555555-0000-0000-0000-000000000002')::text$q$), 'error=42501');
select pg_temp.t('use_consumable_item: o dono usa',       pg_temp.val_as((select bob from who), $q$select public.use_consumable_item('55555555-0000-0000-0000-000000000002')::text$q$), 'true');
select pg_temp.t('use_consumable_item: o Mestre da sessão usa', pg_temp.val_as((select gm from who), $q$select public.use_consumable_item('55555555-0000-0000-0000-000000000002')::text$q$), 'true');


-- ======================= combat_attacks / apply_attack =======================
select pg_temp.t('apply_attack: o atacante no próprio turno tira PV de um aliado', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), '15');
select pg_temp.t('apply_attack: tira PV de um NPC do combate', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',14,17,15,true,false,false,7)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '5');
select pg_temp.t('apply_attack: dois ataques seguidos somam', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,4)$q$, $q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,6)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), '10');
select pg_temp.t('apply_attack: errar não tira PV', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,false,false,false,9)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), '20');
select pg_temp.t('apply_attack: o PV nunca fica abaixo de 0', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,99)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), '0');
select pg_temp.t('apply_attack: grava o ataque com os nomes e o PV antes e depois', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,5)$q$], $q$select attacker_name || '>' || target_name || ':' || target_hp_before || '>' || target_hp_after from public.combat_attacks$q$), 'Alice>Bob:20>15');
select pg_temp.t('apply_attack: quem atacou lê o próprio ataque registrado', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,5)$q$], $q$select count(*)::text from public.combat_attacks$q$), '1');
select pg_temp.t('apply_attack: fora do turno é recusado', pg_temp.after_as((select bob from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), 'error=42501');
select pg_temp.t('apply_attack: Bob ataca no turno dele no outro combate', pg_temp.after_as((select bob from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000004',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000004'$q$), '10');
select pg_temp.t('apply_attack: Alice não ataca no turno do Bob', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000005',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000005'$q$), 'error=42501');
select pg_temp.t('apply_attack: ninguém ataca em nome de outro jogador', pg_temp.after_as((select bob from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), 'error=42501');
select pg_temp.t('apply_attack: estranho é recusado', pg_temp.after_as((select carol from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), 'error=42501');
select pg_temp.t('apply_attack: o Mestre não ataca por um jogador', pg_temp.after_as((select gm from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), 'error=42501');
select pg_temp.t('apply_attack: anon é recusado', pg_temp.after_as(null, array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), 'error=42501');
select pg_temp.t('apply_attack: o alvo precisa estar no mesmo combate', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000008',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000008'$q$), 'error=42501');
select pg_temp.t('apply_attack: combate encerrado é recusado', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000007',14,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000007'$q$), 'error=42501');
select pg_temp.t('apply_attack: ninguém grava em combat_attacks direto', pg_temp.after_as((select alice from who), array[$q$insert into public.combat_attacks (combat_id, attacker_participant_id, target_participant_id, attacker_name, target_name, natural_roll, total, target_ac, hit, critical, fumble, damage, target_hp_before, target_hp_after) values ('99999999-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002','a','b',10,10,10,true,false,false,1,5,4)$q$], $q$select '1'$q$), 'error=42501');
select pg_temp.t('apply_attack: o ataque inválido (d20 fora de 1 a 20) é recusado', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002',21,17,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002'$q$), 'error=23514');

select pg_temp.t('apply_attack: grava a modalidade, os dois d20 e a Inspiração', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',14,19,15,true,false,false,5,'vantagem',array[14,6],true)$q$], $q$select applied_mode || '/' || rolls::text || '/' || inspiration_used from public.combat_attacks$q$), 'vantagem/{14,6}/true');
select pg_temp.t('apply_attack: sem os extras, o ataque é normal e sem Inspiração', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',14,19,15,true,false,false,5)$q$], $q$select applied_mode || '/' || coalesce(rolls::text, 'nulo') || '/' || inspiration_used from public.combat_attacks$q$), 'normal/nulo/false');
select pg_temp.t('apply_attack: o banco recusa uma modalidade desconhecida', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',14,19,15,true,false,false,5,'sorte')$q$], $q$select '1'$q$), 'error=23514');

select pg_temp.t('apply_attack: o efeito de arma coloca a Condição no alvo', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[{"duration": 3, "conditionId": "sangrando"}]');
select pg_temp.t('apply_attack: a Condição repetida é trocada e a duração reinicia', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$, $q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[{"conditionId":"sangrando","duration":5}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[{"duration": 5, "conditionId": "sangrando"}]');
select pg_temp.t('apply_attack: as Condições que o alvo já tinha ficam', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[{"conditionId":"envenenado","duration":2}]'::jsonb)$q$, $q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$], $q$select jsonb_array_length(conditions)::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '2');
select pg_temp.t('apply_attack: o efeito de arma sem acerto não aplica nada', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,false,false,false,5,'normal',null,false,true,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[]');
select pg_temp.t('apply_attack: Condições sem o gatilho do efeito de arma não entram', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,false,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[]');
select pg_temp.t('apply_attack: o efeito de arma sem dano também aplica a Condição', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,0,'normal',null,false,true,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$], $q$select hp_current::text || '/' || jsonb_array_length(conditions) from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '12/1');
select pg_temp.t('apply_attack: registra o gatilho e as Condições aplicadas', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[{"conditionId":"sangrando","duration":3}]'::jsonb)$q$], $q$select weapon_effect_triggered || '/' || weapon_effect_conditions::text from public.combat_attacks$q$), 'true/[{"duration": 3, "conditionId": "sangrando"}]');
select pg_temp.t('apply_attack: efeito resistido registra o gatilho sem Condições', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003',19,24,15,true,false,false,5,'normal',null,false,true,'[]'::jsonb)$q$], $q$select weapon_effect_triggered || '/' || weapon_effect_conditions::text from public.combat_attacks$q$), 'true/[]');

select pg_temp.t('apply_attack: ninguém ataca a si mesmo', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001',14,19,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), 'error=42501');
select pg_temp.t('apply_attack: quem está a 0 PV não ataca', pg_temp.after_as((select alice from who), array[$q$select public.apply_attack('aaaaaaaa-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-00000000000a',14,19,15,true,false,false,5)$q$], $q$select hp_current::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-00000000000a'$q$), 'error=42501');

-- ================= game_sessions / open_short_rest / close_short_rest =================
select pg_temp.t('open_short_rest: anon não abre', pg_temp.run_as(null, $q$select public.open_short_rest('22222222-0000-0000-0000-000000000003')$q$), 'error=42501');
select pg_temp.t('open_short_rest: jogador da sessão não abre', pg_temp.run_as((select dave from who), $q$select public.open_short_rest('22222222-0000-0000-0000-000000000003')$q$), 'error=42501');
select pg_temp.t('open_short_rest: Mestre de outra sessão não abre', pg_temp.run_as((select carol from who), $q$select public.open_short_rest('22222222-0000-0000-0000-000000000003')$q$), 'error=42501');
select pg_temp.t('open_short_rest: Mestre abre e marca "aberto pelo Mestre"', pg_temp.after_as((select gm from who), array[$q$select public.open_short_rest('22222222-0000-0000-0000-000000000003')$q$], $q$select (short_rest_id is not null)::text || '/' || short_rest_opened_by from public.game_sessions where id='22222222-0000-0000-0000-000000000003'$q$), 'true/master');
select pg_temp.t('open_short_rest: abrir conta 1 dos 2 do dia', pg_temp.after_as((select gm from who), array[$q$select public.open_short_rest('22222222-0000-0000-0000-000000000003')$q$], $q$select short_rests_today::text from public.game_sessions where id='22222222-0000-0000-0000-000000000003'$q$), '1');
select pg_temp.t('open_short_rest: devolve a identidade que ficou gravada', pg_temp.after_as((select gm from who), array[$q$create temp table opened as select public.open_short_rest('22222222-0000-0000-0000-000000000003') as id$q$], $q$select (o.id = s.short_rest_id)::text from opened o, public.game_sessions s where s.id='22222222-0000-0000-0000-000000000003'$q$), 'true');
select pg_temp.t('open_short_rest: não abre outro com um aberto', pg_temp.run_as((select gm from who), $q$select public.open_short_rest('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('open_short_rest: combate ativo bloqueia', pg_temp.run_as((select gm from who), $q$select public.open_short_rest('22222222-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('open_short_rest: combate encerrado não bloqueia', pg_temp.after_as((select gm from who), array[$q$update public.combats set status='finished' where session_id='22222222-0000-0000-0000-000000000001'$q$, $q$select public.open_short_rest('22222222-0000-0000-0000-000000000001')$q$], $q$select short_rest_opened_by from public.game_sessions where id='22222222-0000-0000-0000-000000000001'$q$), 'master');
select pg_temp.t('open_short_rest: sem Descanso Curto restante bloqueia', pg_temp.after_as((select gm from who), array[$q$update public.game_sessions set short_rests_today=2 where id='22222222-0000-0000-0000-000000000003'$q$, $q$select public.open_short_rest('22222222-0000-0000-0000-000000000003')$q$], $q$select short_rests_today::text from public.game_sessions where id='22222222-0000-0000-0000-000000000003'$q$), 'error=42501');
select pg_temp.t('open_short_rest: sessão que não existe', pg_temp.run_as((select gm from who), $q$select public.open_short_rest('22222222-0000-0000-0000-0000000000ff')$q$), 'error=42501');
select pg_temp.t('close_short_rest: anon não encerra', pg_temp.run_as(null, $q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('close_short_rest: jogador não encerra', pg_temp.run_as((select dave from who), $q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('close_short_rest: Mestre de outra sessão não encerra', pg_temp.run_as((select carol from who), $q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('close_short_rest: Mestre encerra', pg_temp.after_as((select gm from who), array[$q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$], $q$select (short_rest_id is null)::text || '/' || (short_rest_opened_by is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000004'$q$), 'true/true');
select pg_temp.t('close_short_rest: zera os pedidos e quem terminou', pg_temp.after_as((select gm from who), array[$q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$], $q$select cardinality(short_rest_requested)::text || '/' || cardinality(short_rest_finished)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000004'$q$), '0/0');
select pg_temp.t('close_short_rest: encerrar não devolve o Descanso Curto do dia', pg_temp.after_as((select gm from who), array[$q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$], $q$select short_rests_today::text from public.game_sessions where id='22222222-0000-0000-0000-000000000004'$q$), '1');
select pg_temp.t('close_short_rest: sem descanso aberto não dá erro', pg_temp.run_as((select gm from who), $q$select public.close_short_rest('22222222-0000-0000-0000-000000000003')$q$), 'rows=1');
select pg_temp.t('game_sessions: o Mestre fecha o descanso pela atualização direta (Descanso Longo, período)', pg_temp.after_as((select gm from who), array[$q$update public.game_sessions set short_rest_id=null, short_rest_opened_by=null, short_rest_requested='{}', short_rest_finished='{}' where id='22222222-0000-0000-0000-000000000004'$q$], $q$select (short_rest_id is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000004'$q$), 'true');
select pg_temp.t('game_sessions: jogador não altera o descanso direto', pg_temp.run_as((select dave from who), $q$update public.game_sessions set short_rest_id=null, short_rest_opened_by=null where id='22222222-0000-0000-0000-000000000004'$q$), 'rows=0');
select pg_temp.t('game_sessions: o banco recusa "aberto por" desconhecido', pg_temp.run_as((select gm from who), $q$update public.game_sessions set short_rest_opened_by='todos' where id='22222222-0000-0000-0000-000000000004'$q$), 'error=23514');
select pg_temp.t('game_sessions: o banco recusa descanso aberto sem "aberto por"', pg_temp.run_as((select gm from who), $q$update public.game_sessions set short_rest_opened_by=null where id='22222222-0000-0000-0000-000000000004'$q$), 'error=23514');

-- ============ Pedido de Descanso: request / withdraw / finish / refuse ============
-- Quem conta no "todos" (a mesma definição do motor): jogadores vivos, sem NPC nem inimigo.
select pg_temp.t('short_rest_player_ids: jogadores vivos da sessão, sem NPC, inimigo nem Morto', (select string_agg(i::text, ',' order by i) from unnest(public.short_rest_player_ids('22222222-0000-0000-0000-000000000005')) i), '33333333-0000-0000-0000-000000000001,33333333-0000-0000-0000-000000000002');
select pg_temp.t('short_rest_player_ids: o jogador não chama a função auxiliar', pg_temp.run_as((select alice from who), $q$select public.short_rest_player_ids('22222222-0000-0000-0000-000000000005')$q$), 'error=42501');

select pg_temp.t('request_short_rest: anon não pede', pg_temp.run_as(null, $q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('request_short_rest: jogador de fora da sessão não pede', pg_temp.run_as((select dave from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000005')$q$), 'error=42501');
select pg_temp.t('request_short_rest: não se pede pelo personagem de outro', pg_temp.run_as((select alice from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002')$q$), 'error=42501');
select pg_temp.t('request_short_rest: o Mestre não pede pelo NPC', pg_temp.run_as((select gm from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('request_short_rest: personagem Morto não pede', pg_temp.run_as((select carol from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000006')$q$), 'error=42501');
select pg_temp.t('request_short_rest: o primeiro pedido ainda não abre', pg_temp.val_as((select alice from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')::text$q$), 'false');
select pg_temp.t('request_short_rest: grava o pedido e deixa o descanso fechado', pg_temp.seq_as(array[(select alice from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$], $q$select cardinality(short_rest_requested)::text || '/' || (short_rest_id is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), '1/true');
select pg_temp.t('request_short_rest: pedir duas vezes não duplica', pg_temp.seq_as(array[(select alice from who),(select alice from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$], $q$select cardinality(short_rest_requested)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), '1');
select pg_temp.t('request_short_rest: o último pedido abre "pelo grupo" (NPC, inimigo e Morto não contam)', pg_temp.seq_as(array[(select alice from who),(select bob from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002')$q$], $q$select (short_rest_id is not null)::text || '/' || short_rest_opened_by from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), 'true/group');
select pg_temp.t('request_short_rest: abrir conta 1 dos 2 do dia e zera os pedidos', pg_temp.seq_as(array[(select alice from who),(select bob from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002')$q$], $q$select short_rests_today::text || '/' || cardinality(short_rest_requested)::text || '/' || cardinality(short_rest_finished)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), '1/0/0');
select pg_temp.t('request_short_rest: quem pede sozinho num grupo de um abre na hora', pg_temp.seq_as(array[(select dave from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000005')$q$], $q$select short_rest_opened_by from public.game_sessions where id='22222222-0000-0000-0000-000000000003'$q$), 'group');
select pg_temp.t('request_short_rest: combate ativo bloqueia', pg_temp.run_as((select alice from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('request_short_rest: sem Descanso Curto restante bloqueia', pg_temp.run_as((select alice from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000007','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('request_short_rest: com descanso aberto bloqueia', pg_temp.run_as((select dave from who), $q$select public.request_short_rest('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000005')$q$), 'error=42501');
select pg_temp.t('request_short_rest: sessão que não existe', pg_temp.run_as((select alice from who), $q$select public.request_short_rest('22222222-0000-0000-0000-0000000000ff','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');

select pg_temp.t('withdraw_short_rest_request: retira o próprio pedido', pg_temp.seq_as(array[(select alice from who),(select alice from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.withdraw_short_rest_request('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$], $q$select cardinality(short_rest_requested)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), '0');
select pg_temp.t('withdraw_short_rest_request: anon não retira', pg_temp.run_as(null, $q$select public.withdraw_short_rest_request('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('withdraw_short_rest_request: não retira o pedido do outro', pg_temp.run_as((select alice from who), $q$select public.withdraw_short_rest_request('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000002')$q$), 'error=42501');
select pg_temp.t('withdraw_short_rest_request: jogador de fora não retira', pg_temp.run_as((select dave from who), $q$select public.withdraw_short_rest_request('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000005')$q$), 'error=42501');

select pg_temp.t('refuse_short_rest_requests: anon não recusa', pg_temp.run_as(null, $q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('refuse_short_rest_requests: jogador não recusa', pg_temp.run_as((select dave from who), $q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('refuse_short_rest_requests: Mestre de outra sessão não recusa', pg_temp.run_as((select carol from who), $q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000004')$q$), 'error=42501');
select pg_temp.t('refuse_short_rest_requests: o Mestre zera os pedidos', pg_temp.seq_as(array[(select alice from who),(select gm from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000005')$q$], $q$select cardinality(short_rest_requested)::text || '/' || (short_rest_id is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), '0/true');

select pg_temp.t('refuse_short_rest_requests: grava a hora da recusa', pg_temp.seq_as(array[(select alice from who),(select gm from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000005')$q$], $q$select (short_rest_refused_at is not null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), 'true');
select pg_temp.t('request_short_rest: um novo pedido limpa a recusa', pg_temp.seq_as(array[(select alice from who),(select gm from who),(select alice from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000005')$q$,$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$], $q$select (short_rest_refused_at is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), 'true');
select pg_temp.t('open_short_rest: abrir limpa a recusa', pg_temp.seq_as(array[(select alice from who),(select gm from who),(select gm from who)], array[$q$select public.request_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$,$q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000005')$q$,$q$select public.open_short_rest('22222222-0000-0000-0000-000000000005')$q$], $q$select (short_rest_refused_at is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000005'$q$), 'true');
select pg_temp.t('close_short_rest: encerrar limpa a recusa', pg_temp.seq_as(array[(select gm from who),(select gm from who)], array[$q$select public.refuse_short_rest_requests('22222222-0000-0000-0000-000000000004')$q$,$q$select public.close_short_rest('22222222-0000-0000-0000-000000000004')$q$], $q$select (short_rest_refused_at is null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000004'$q$), 'true');

select pg_temp.t('finish_short_rest: anon não termina', pg_temp.run_as(null, $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('finish_short_rest: jogador de fora não termina', pg_temp.run_as((select dave from who), $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000005')$q$), 'error=42501');
select pg_temp.t('finish_short_rest: não termina pelo personagem do outro', pg_temp.run_as((select alice from who), $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000002')$q$), 'error=42501');
select pg_temp.t('finish_short_rest: o Mestre não termina por jogador', pg_temp.run_as((select gm from who), $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('finish_short_rest: sem descanso aberto não termina', pg_temp.run_as((select alice from who), $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001')$q$), 'error=42501');
select pg_temp.t('finish_short_rest: o primeiro a terminar não fecha', pg_temp.seq_as(array[(select alice from who)], array[$q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')$q$], $q$select cardinality(short_rest_finished)::text || '/' || (short_rest_id is not null)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000006'$q$), '1/true');
select pg_temp.t('finish_short_rest: terminar duas vezes não duplica', pg_temp.seq_as(array[(select alice from who),(select alice from who)], array[$q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')$q$,$q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')$q$], $q$select cardinality(short_rest_finished)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000006'$q$), '1');
select pg_temp.t('finish_short_rest: o último a terminar fecha e zera tudo (o Morto não conta)', pg_temp.seq_as(array[(select alice from who),(select bob from who)], array[$q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')$q$,$q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000002')$q$], $q$select (short_rest_id is null)::text || '/' || (short_rest_opened_by is null)::text || '/' || cardinality(short_rest_requested)::text || '/' || cardinality(short_rest_finished)::text from public.game_sessions where id='22222222-0000-0000-0000-000000000006'$q$), 'true/true/0/0');
select pg_temp.t('finish_short_rest: fechar não devolve o Descanso Curto do dia', pg_temp.seq_as(array[(select dave from who)], array[$q$select public.finish_short_rest('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000005')$q$], $q$select short_rests_today::text from public.game_sessions where id='22222222-0000-0000-0000-000000000004'$q$), '1');
select pg_temp.t('finish_short_rest: devolve true ao fechar', pg_temp.val_as((select dave from who), $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000005')::text$q$), 'true');
select pg_temp.t('finish_short_rest: devolve false enquanto falta alguém', pg_temp.val_as((select alice from who), $q$select public.finish_short_rest('22222222-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001')::text$q$), 'false');

-- ================= combat_ability_uses / record_ability_use =================
select pg_temp.t('record_ability_use: o usuário no próprio turno aplica a Condição no alvo', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[{"duration": 1, "conditionId": "paralisado"}]');
select pg_temp.t('record_ability_use: Condição sem duração fica até ser removida', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"caido","duration":null}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[{"duration": null, "conditionId": "caido"}]');
select pg_temp.t('record_ability_use: a Reação vale fora do turno', pg_temp.after_as((select bob from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000002','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','reaction','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000001","conditions":[{"conditionId":"amedrontado","duration":null}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), '[{"duration": null, "conditionId": "amedrontado"}]');
select pg_temp.t('record_ability_use: a Ação Livre vale fora do turno', pg_temp.after_as((select bob from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000002','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','free_action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000001","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), '[{"duration": 1, "conditionId": "paralisado"}]');
select pg_temp.t('record_ability_use: Ação fora do turno é recusada', pg_temp.after_as((select bob from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000002','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000001","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), 'error=42501');
select pg_temp.t('record_ability_use: Ação Bônus fora do turno é recusada', pg_temp.after_as((select bob from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000002','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','bonus_action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000001","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000001'$q$), 'error=42501');
select pg_temp.t('record_ability_use: Bob usa no turno dele no outro combate', pg_temp.after_as((select bob from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000005','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000004","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000004'$q$), '[{"duration": 1, "conditionId": "paralisado"}]');
select pg_temp.t('record_ability_use: ninguém usa em nome de outro jogador', pg_temp.after_as((select bob from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), 'error=42501');
select pg_temp.t('record_ability_use: estranho é recusado', pg_temp.after_as((select carol from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), 'error=42501');
select pg_temp.t('record_ability_use: o Mestre não usa por um jogador', pg_temp.after_as((select gm from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), 'error=42501');
select pg_temp.t('record_ability_use: anon é recusado', pg_temp.after_as(null, array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), 'error=42501');
select pg_temp.t('record_ability_use: o alvo precisa estar no mesmo combate', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000008","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000008'$q$), 'error=42501');
select pg_temp.t('record_ability_use: combate encerrado é recusado', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000006','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000007","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000007'$q$), 'error=42501');
select pg_temp.t('record_ability_use: quem está a 0 PV não usa', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000009','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-00000000000a","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-00000000000a'$q$), 'error=42501');
select pg_temp.t('record_ability_use: sem alvo é recusado', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[]'::jsonb)$q$], $q$select '1'$q$), 'error=22023');
select pg_temp.t('record_ability_use: tipo de ação desconhecido é recusado', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','passive','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select '1'$q$), 'error=23514');
select pg_temp.t('record_ability_use: a Condição repetida é trocada e a duração reinicia', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$, $q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','reaction','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":4}]}]'::jsonb)$q$], $q$select conditions::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '[{"duration": 4, "conditionId": "paralisado"}]');
select pg_temp.t('record_ability_use: as Condições que o alvo já tinha ficam', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"envenenado","duration":2}]}]'::jsonb)$q$, $q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','reaction','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select jsonb_array_length(conditions)::text from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '2');
select pg_temp.t('record_ability_use: Condição anulada (lista vazia) registra o uso e não muda o alvo', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[]}]'::jsonb)$q$], $q$select jsonb_array_length(conditions)::text || '/' || (select count(*) from public.combat_ability_uses) from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'$q$), '0/1');
select pg_temp.t('record_ability_use: vários alvos recebem a Condição', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000002","conditions":[{"conditionId":"paralisado","duration":1}]},{"participantId":"aaaaaaaa-0000-0000-0000-000000000003","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select ((select jsonb_array_length(conditions) from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000002') + (select jsonb_array_length(conditions) from public.combat_participants where id='aaaaaaaa-0000-0000-0000-000000000003'))::text$q$), '2');
select pg_temp.t('record_ability_use: grava o uso com os nomes, a Habilidade e as Condições aplicadas', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000002","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select user_name || '>' || ability_name || '>' || action_type || '>' || status || '>' || (targets -> 0 ->> 'name') || '>' || jsonb_array_length(targets -> 0 -> 'conditions') from public.combat_ability_uses$q$), 'Alice>Palavra de Autoridade>action>applied>Bob>1');
select pg_temp.t('record_ability_use: quem usou lê o uso registrado', pg_temp.after_as((select alice from who), array[$q$select public.record_ability_use('aaaaaaaa-0000-0000-0000-000000000001','tribe-levi-16-palavra-de-auto','Palavra de Autoridade','action','[{"participantId":"aaaaaaaa-0000-0000-0000-000000000002","conditions":[{"conditionId":"paralisado","duration":1}]}]'::jsonb)$q$], $q$select count(*)::text from public.combat_ability_uses$q$), '1');
select pg_temp.t('record_ability_use: ninguém grava em combat_ability_uses direto', pg_temp.after_as((select alice from who), array[$q$insert into public.combat_ability_uses (combat_id, user_participant_id, user_name, ability_id, ability_name, action_type) values ('99999999-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','a','b','c','action')$q$], $q$select '1'$q$), 'error=42501');

-- ============================ resultado ============================
do $$
declare bad text; total int; ok int;
begin
  select count(*) into total from results;
  select count(*) into ok from results where actual is not distinct from expected;
  select string_agg(format('  - %s: esperado %s, veio %s', name, expected, actual), E'\n' order by name)
    into bad from results where actual is distinct from expected;
  if bad is not null then
    raise exception E'RLS: % de % falharam:\n%', total - ok, total, bad;
  end if;
  raise notice 'RLS: % verificações ok', total;
end $$;
