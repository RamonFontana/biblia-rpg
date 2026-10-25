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
select pg_temp.t('game_sessions: jogador lê só a sua sessão',     pg_temp.run_as((select alice from who), 'select * from public.game_sessions'), 'rows=1');
select pg_temp.t('game_sessions: Mestre lê a que criou',          pg_temp.run_as((select carol from who), 'select * from public.game_sessions'), 'rows=1');
select pg_temp.t('characters: logado lê todos',                  pg_temp.run_as((select carol from who), 'select * from public.characters'), 'rows=5');
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
