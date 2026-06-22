# Phase 0: Research

## R1. Lógica de "Versátil" (Duas mãos)
**Decision**: O usuário poderá equipar uma arma Versátil com uma ou duas mãos diretamente da UI do inventário.
**Rationale**: Para armas versáteis (slot `'1h'`), permitiremos o botão "Equipar (Duas Mãos)", que ocupará tanto a `mainHand` quanto a `offHand`, e alterará o dano mostrado para `versatileDamageDie`. Isso exigirá pequenas alterações em `EquipmentSlots.tsx` e `InventoryList.tsx`.

## R2. Lógica de "Acuidade" (Finesse) e Propriedades das Armas
**Decision**: Expandir o `itemsDb.ts` (e a tabela `items` via `syncInventory.ts`) para incluir a chave de `properties` dentro dos `effects`.
**Rationale**: Adicionando `properties: ['finesse', 'thrown', 'ammunition']` aos `effects`, a UI poderá exibir avisos e alterar modificadores de maneira escalável. Como os ataques atualmente são manuais (rolagem do jogador), a interface deve orientar qual modificador usar.

## R3. Gerenciamento de Munição (Flechas e Pedras)
**Decision**: Tratar as munições como itens do tipo `Consumível`.
**Rationale**: Isso permite ao jogador usar o botão "Usar" em "Flechas" ou "Saco de Pedras" na aba de Inventário para subtrair a quantidade. No futuro, isso pode ser integrado diretamente a um botão de "Atacar".

## R4. Símbolo Proibido e Perda de Fé
**Decision**: O Símbolo Proibido será um item no `itemsDb.ts` com um efeito passivo.
**Rationale**: Quando esse item estiver presente no inventário (`character_items`), componentes de sessão que checam a saúde do jogador podem exibir o status de penalidade na Fé. 

## R5. Penalidade em Armaduras (Furtividade)
**Decision**: Mostrar um alerta de "Desvantagem" caso o `PlayerTestDialog.tsx` receba um teste de *Furtividade* ou *Destreza* e o jogador tenha armaduras pesadas equipadas.
**Rationale**: Como a mecânica primária depende do jogador informar a rolagem física (ou clicar no D20), o sistema deve avisá-lo com clareza visual para rolar dois dados e pegar o pior.
