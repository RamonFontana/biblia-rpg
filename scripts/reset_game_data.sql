-- ====================================================================================
-- SCRIPT DE RESET DE DADOS (DADOS DE JOGO)
-- ====================================================================================
-- Este script apaga todos os dados de personagens, sessões de jogo e seus históricos 
-- (combates, testes, trocas, inventários de personagens, etc.), mantendo os usuários 
-- registrados (auth.users) e os itens/kits base (items, kit_items) intactos.
-- 
-- COMO EXECUTAR:
-- 1. Acesse o painel do Supabase (https://app.supabase.com)
-- 2. Vá até o "SQL Editor"
-- 3. Cole este código e clique em "Run"
-- ====================================================================================

BEGIN;

-- O comando TRUNCATE com CASCADE limpa as tabelas indicadas e também TODAS 
-- as outras tabelas que dependem delas por meio de chaves estrangeiras (Foreign Keys).
--
-- Tabelas que serão limpas automaticamente pelo CASCADE:
-- - character_items
-- - combat_participants
-- - combats
-- - session_enemies
-- - session_npcs
-- - session_participants
-- - session_test_results
-- - session_tests
-- - trade_items
-- - trades

TRUNCATE TABLE 
  public.characters,
  public.game_sessions
CASCADE;

COMMIT;

-- Nota: Usuários (auth.users) e Itens (public.items e public.kit_items) NÃO serão afetados.
