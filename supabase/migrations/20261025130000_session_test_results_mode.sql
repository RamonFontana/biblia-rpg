-- Vantagem e Desvantagem nos Testes (Onda 5): o Mestre marca a modalidade de cada alvo ao pedir o
-- Teste, o jogador grava a modalidade que de fato valeu (com as Desvantagens automáticas) e, se
-- usou a Rolagem Virtual, os dois dados rolados. `roll_value` segue sendo o dado que vale.
--
-- `master_mark` nulo é Normal. `applied_mode` fica nulo até o resultado ser enviado (e nos
-- resultados anteriores a esta migration). As políticas de `session_test_results` valem para as
-- colunas novas sem mudança: o Mestre cria o resultado pendente e o dono grava o próprio.

alter table public.session_test_results
  add column master_mark text check (master_mark in ('vantagem', 'desvantagem')),
  add column applied_mode text check (applied_mode in ('normal', 'vantagem', 'desvantagem')),
  add column roll_values integer[];
