-- `characters.coins` guarda Siclos, e os preços da loja chegam a 0,025 SP (a Tocha custa 0,5; a
-- Pedra para Funda, 0,025; a Flecha, 0,05; ver `src/content/items.ts` e `docs/itens/consumiveis.md`).
-- Com a coluna inteira, qualquer compra fracionada deixava a carteira fora do que o banco aceita
-- ("invalid input syntax for type integer: \"49.5\"") e a criação do personagem não salvava.
--
-- `numeric(12, 3)` guarda até o milésimo, a casa mais fina dos preços. Os valores inteiros que já
-- existem passam como estão. O padrão (0) é mantido. A tela arredonda só o que mostra.
--
-- As colunas de moedas das trocas (`initiator_coins`, `target_coins`) seguem inteiras: as trocas
-- são em Siclos inteiros, e `execute_trade` soma e subtrai delas da carteira sem mudar de tipo.

alter table public.characters
  alter column coins type numeric(12, 3);
