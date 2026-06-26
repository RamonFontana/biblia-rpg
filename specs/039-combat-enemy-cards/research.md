# Research: combat-enemy-cards

## Validação de Sincronização de PV (HP)
**Decision**: A sincronização de alterações de PV (HP) já é tratada automaticamente para todos os jogadores via Supabase Realtime. Não é necessário implementar lógica adicional de rede para isso.
**Rationale**: No arquivo `src/store/combatStore.ts` (linhas 157-180), a `useCombatStore` cria um `channel` que escuta eventos `postgres_changes` na tabela `combat_participants`. Quando há um evento do tipo `UPDATE` (por exemplo, quando o Mestre ou o sistema altera o `hp_current` do inimigo no banco de dados), a store recebe o payload e atualiza o estado local (`newParticipants.map(...)`). Isso garante que qualquer alteração de vida do inimigo será refletida em tempo real na tela de todos os jogadores conectados na sessão.
**Alternatives considered**: Polling de banco de dados ou chamadas RPC manuais. Rejeitado pois o ecossistema Supabase Realtime já foi estabelecido no projeto e está devidamente configurado para os participantes do combate.

## Componentes de Interface
**Decision**: O front-end precisará de componentes `EnemyCombatList`, `EnemyCard` (resumo) e um modal ou drawer para `EnemySheet` (ficha completa).
**Rationale**: Cumpre as User Stories da especificação que exigem listar inimigos e permitir consulta rápida de status e atributos.
