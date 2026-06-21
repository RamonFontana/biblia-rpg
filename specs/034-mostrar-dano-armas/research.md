# Research: Mostrar Dano de Armas no Inventário

## Decision: Exibir Dano Baseado no Banco de Dados Local (ITEMS_DB)
A propriedade `effects` na tabela `items` do Supabase pode não estar preenchida para itens criados anteriormente, e a extração feita na sincronização divide o dano (`damageDie` e `damageType`).
O ideal para a interface do jogador é visualizar o dano completo e o seu tipo ("1d6 cortante").

### Rationale
Usar o `ITEMS_DB` local importado como um "fallback" e fonte de verdade da exibição de UI garante que, mesmo que os efeitos não estejam corretamente persistidos no Supabase como JSON, a UI sempre renderizará a string correta com base no nome do item.
Além disso, `ITEMS_DB` expõe a string amigável de dano que ajuda na imersão e entendimento do jogador.

### Alternatives considered
- Atualizar todos os registros no Supabase via script de migração para forçar a coluna `effects` a estar devidamente preenchida para todos. (Rejeitado por adicionar complexidade desnecessária quando a aplicação já possui os dados no client-side em `itemsDb.ts`).

## Componente Alvo
`src/components/inventory/InventoryList.tsx`

Será necessário importar `ITEMS_DB` e utilizar `item.items?.name` para resgatar a propriedade `damage` original (ex: `1d6 cortante`) caso `normalizedEffects.damageDie` esteja incompleto, ou simplesmente priorizar a string em `ITEMS_DB`.
