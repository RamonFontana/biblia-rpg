# Quickstart: combat-enemy-cards

## Pré-requisitos
A visualização de combate depende que o jogador já esteja em uma sessão com um combate ativo ou em setup.

## Implementação Base

1. Acesse o componente principal do combate na visão do jogador (`PlayerCombatView.tsx` ou similar).
2. Injete a lista de inimigos resgatando de `useCombatStore()` os `participants` onde o `entity_type` seja `enemy` ou `npc`.
3. Renderize os participantes como `EnemyCard`.
4. Ao clicar no `EnemyCard`, abra um Modal ou Drawer exibindo o `EnemySheet` completo.

O `combatStore` já gerencia a sincronização de PV (HP) atualizados em tempo real via Supabase. Nenhuma alteração extra no state é necessária para capturar o HP atual, basta consumir `participant.hp_current`.
