-- Guarda o dado que o jogador rolou (d20 ou d100), separado do total com os bônus.
-- Permite mostrar "1d20 (13) + bônus" sem reconstruir o dado com os modificadores de hoje.
-- Nula nos testes anteriores a esta migração: a tela continua reconstruindo o dado neles.
alter table public.session_test_results
  add column roll_value integer;

comment on column public.session_test_results.roll_value is
  'Dado rolado pelo jogador, sem modificadores. Nulo em testes antigos.';
