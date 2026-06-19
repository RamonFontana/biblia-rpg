# Research: Sistema de Combate - Teste de Morte e Fim de Combate

## Database Sync Strategy

**Decision**: Utilizar inscrições do Supabase Realtime nas tabelas `combat_sessions`, `combat_participants` e `characters`.
**Rationale**: Como o estado de HP e status de morte afeta a visão tanto do Mestre quanto dos jogadores quase que instantaneamente, o uso de Realtime garante a fluidez sem polling.
**Alternatives considered**: Polling (rejeitado por latência e peso no servidor).

## Death State Transition

**Decision**: O status de morte será verificado toda vez que houver alteração de HP (`current_hp`). Se o HP for `<= 0`, as flags de `death_saves` são ativadas na interface (e sincronizadas via `combat_participants` ou `characters`). 
**Rationale**: Garantir que as regras sejam aplicadas de forma consistente, quer a vida zere num ataque de combate ou por dano genérico da tela de sessão principal.
