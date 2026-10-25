-- Teste de Fé na mesa (Onda 5): o Mestre diz o uso do Teste (Clamor, Tentação ou Testemunho) e,
-- no Clamor, se o pedido é egoísta. A falha custa 1d6 de Fé conforme o uso: o Clamor só com
-- Pedido Egoísta; a Tentação e o Testemunho sempre (docs/regras-base.md, 4.4).
--
-- `faith_use` é nulo nos Testes que não são de Fé e nos Testes de Fé criados antes desta migration
-- (a falha deles segue custando Fé, como era). As políticas de linha de `session_tests` valem para
-- as colunas novas sem mudança: só o Mestre da sessão cria e altera.

alter table public.session_tests
  add column faith_use text check (faith_use in ('clamor', 'tentacao', 'testemunho')),
  add column selfish_request boolean not null default false;
