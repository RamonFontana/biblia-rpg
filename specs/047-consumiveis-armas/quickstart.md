# Quickstart: Mecânica de Munição e Consumíveis

**Branch**: `047-consumiveis-armas` | **Date**: 2026-07-03

## Como iniciar o desenvolvimento

1. Analise o componente `InventoryList.tsx` e como os consumíveis são listados.
2. Adicione os botões "[Gastar 1]" e "[Recuperar]" na listagem de um item no inventário (condicional caso `is_consumable` seja true e/ou os `weapon_effects` indiquem `max_charges`).
3. Crie as funções de manipulação de quantidade (decremento atômico) usando as queries do Supabase ou ajuste `use_consumable_item`.
4. Teste a recuperação clicando no botão e conferindo se a quantidade sobe aleatoriamente até o limite estipulado.
5. Acesse a visão do Mestre (`MasterItemActions.tsx` ou análogo) e inclua uma ação para "+ Adicionar Cargas" aos itens do jogador.
