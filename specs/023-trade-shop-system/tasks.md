# Tasks: Sistema de Negociação e Lojinha

**Input**: Design documents from `/specs/023-trade-shop-system/`

**Prerequisites**: [plan.md](plan.md) | [spec.md](spec.md) | [research.md](research.md) | [data-model.md](data-model.md)

**Organization**: Tarefas agrupadas por User Story para implementação e teste independente de cada história.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User Story associada (US1, US2, US3, US4)
- Caminhos de arquivo exatos em cada descrição

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Criar tipos TypeScript e serviço base de negociações.

- [X] T001 Criar tipos TypeScript para o sistema de trocas em `src/types/trade.ts` (interfaces: `Trade`, `TradeItem`, `TradeType`, `TradeStatus`, `TradeSide`)

---

## Phase 2: Fundacional (Pré-requisitos Bloqueantes)

**Propósito**: Banco de dados e serviços de suporte que DEVEM estar completos antes de qualquer User Story.

**⚠️ CRÍTICO**: Nenhuma User Story pode começar antes desta fase estar completa.

- [X] T002 Criar migração SQL `supabase/migrations/XXXXXX_add_price_to_items.sql` para adicionar coluna `price INTEGER DEFAULT NULL` à tabela `items`
- [X] T003 Criar migração SQL `supabase/migrations/XXXXXX_create_trade_tables.sql` com tabelas `trades` e `trade_items`, índices, RLS policies e habilitar Realtime
- [X] T004 Criar migração SQL `supabase/migrations/XXXXXX_create_trade_rpc_functions.sql` com as funções PL/pgSQL `execute_trade(p_trade_id UUID)` e `cancel_session_trades(p_session_id UUID)`
- [ ] T005 Aplicar as 3 migrações no banco remoto via Supabase Dashboard (SQL Editor)
- [X] T006 Criar serviço `src/services/tradeService.ts` com funções: `createTrade()`, `acceptTrade()`, `cancelTrade()`, `updateTradeOffer()`, `setReady()`, `executeTrade()`, `addTradeItem()`, `removeTradeItem()`
- [X] T007 Criar hook `src/hooks/useSessionTrades.ts` com: carregamento de trades da sessão, subscription Realtime em `trades` e `trade_items`, e estado derivado de "personagens em negociação" (para indicador de busy)

**Checkpoint**: Banco preparado, serviço e hook prontos — User Stories podem começar.

---

## Phase 3: User Story 1 — Negociação entre Jogadores (Priority: P1) 🎯 MVP

**Goal**: Dois jogadores podem solicitar, montar, confirmar e executar uma troca de itens e SP.

**Independent Test**: Abrir duas abas com dois jogadores diferentes na mesma sessão. Jogador A inicia negociação com Jogador B. Jogador B recebe popup, aceita. Ambos adicionam itens/SP e clicam "Pronto". Verificar transferência de itens e SP nos inventários.

### Implementação — User Story 1

- [X] T008 [P] [US1] Criar componente `src/components/session/TradeItemSelector.tsx` — seletor de itens com busca por nome, exibição de preço em SP ("—" se null) e controle de quantidade
- [X] T009 [P] [US1] Criar componente `src/components/session/TradeSide.tsx` — exibe o inventário de um lado com itens selecionados, campo de SP, botão "Pronto" e status de prontidão
- [X] T010 [US1] Criar componente `src/components/session/TradeDialog.tsx` — modal completo com dois `TradeSide`, cabeçalho mostrando os dois participantes, botão Cancelar e lógica de confirmação mútua (depende de T008, T009)
- [X] T011 [US1] Criar componente `src/components/session/TradeRequestNotification.tsx` — popup/toast para solicitação de troca recebida com botões Aceitar/Recusar
- [X] T012 [US1] Modificar `src/components/session/PlayerCard.tsx` — adicionar indicador "⚖️ Negociando..." (animated badge) quando `isTrading=true`, e botão "Negociar" visível apenas quando o personagem não está em negociação e não é GM
- [X] T013 [US1] Modificar `src/components/session/SessionParticipantList.tsx` — receber prop `activeTrades` e `onNegotiate`, computar `isTrading` por personagem a partir das trades ativas, bloquear cliques quando `isTrading=true`, renderizar `TradeRequestNotification` para trades pendentes direcionadas ao usuário atual
- [X] T014 [US1] Modificar `src/pages/session/ActiveSessionPage.tsx` — integrar `useSessionTrades`, passar `activeTrades` e handlers para `SessionParticipantList`, renderizar `TradeDialog` quando há trade ativa do usuário, cancelar trades ao desconectar/encerrar sessão

**Checkpoint**: Dois jogadores conseguem completar uma troca completa de itens e SP.

---

## Phase 4: User Story 2 — Lojinha do Mestre (Priority: P1)

**Goal**: O Mestre pode abrir uma lojinha para qualquer jogador com estoque infinito de itens e SP.

**Independent Test**: Como Mestre, clicar em "Lojinha" no card de um jogador. Verificar que a janela abre diretamente (sem aceite). Mestre seleciona itens do catálogo global e SP. Jogador confirma. Executar. Verificar que itens aparecem no inventário do jogador.

### Implementação — User Story 2

- [X] T015 [US2] Modificar `src/components/session/TradeDialog.tsx` — adicionar suporte a `type='shop'`: lado do Mestre usa catálogo global de `items` (sem filtro de inventário), sem validação de saldo/estoque do lado Mestre, label "Lojinha do Mestre" no cabeçalho
- [X] T016 [US2] Modificar `src/components/session/PlayerCard.tsx` — exibir botão "🏪 Lojinha" apenas para o Mestre (`viewerIsGM=true`), chamar `onShop(userId)` ao clicar, ocultar botão quando jogador está em negociação
- [X] T017 [US2] Modificar `src/components/session/SessionParticipantList.tsx` — receber prop `onShop`, criar trade do tipo `shop` ao chamar, abrir `TradeDialog` direto (sem fluxo de aceite)
- [X] T018 [US2] Modificar `src/pages/session/ActiveSessionPage.tsx` — passar handler `onShop` para `SessionParticipantList`; na lojinha o trade é criado com `status='active'` diretamente

**Checkpoint**: Mestre consegue entregar itens e SP a jogadores via lojinha.

---

## Phase 5: User Story 3 — Negociação com NPC (Priority: P2)

**Goal**: Jogador solicita troca com NPC visível; Mestre aceita e controla o lado do NPC.

**Independent Test**: Jogador clica "Negociar" em NPC visível. Mestre recebe notificação e aceita. Janela abre com inventário do NPC (ou catálogo se NPC simples). Ambos confirmam. Verificar transferência.

### Implementação — User Story 3

- [X] T019 [US3] Modificar `src/components/session/SessionNPCList.tsx` — adicionar botão "Negociar" em NPCs visíveis (`is_visible=true`) na visão do jogador; ao clicar, criar trade do tipo `npc_trade` com `target_npc_id` e enviar notificação ao Mestre
- [X] T020 [US3] Modificar `src/components/session/TradeRequestNotification.tsx` — suportar notificações de trade com NPC (exibir nome do NPC no lugar do personagem alvo); mostrar ao Mestre quando um jogador solicita troca com NPC
- [X] T021 [US3] Modificar `src/components/session/TradeDialog.tsx` — suporte a `type='npc_trade'`: lado do NPC usa inventário real do NPC jogável (`character_items`) ou catálogo global (NPC simples); Mestre vê e controla o lado do NPC
- [X] T022 [US3] Modificar `src/pages/session/ActiveSessionPage.tsx` — passar handler `onNPCNegotiate` para `SessionNPCList`, renderizar notificação de trade com NPC para o Mestre

**Checkpoint**: Jogadores podem negociar com NPCs com o Mestre mediando.

---

## Phase 6: User Story 4 — Legenda de Preços dos Itens (Priority: P3)

**Goal**: Todos os itens exibem preço de referência em SP nas janelas de negociação.

**Independent Test**: Abrir qualquer negociação. Verificar que cada item mostra preço em SP ao lado do nome. Verificar que itens sem preço mostram "—".

### Implementação — User Story 4

- [X] T023 [US4] Modificar `src/components/session/TradeItemSelector.tsx` — garantir que o campo `price` do item seja exibido como "X SP" quando definido, ou "—" quando `null`; estilizar como badge/label de referência informativa ao lado do nome do item

**Checkpoint**: Legenda de preços visível em todas as negociações.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Propósito**: Melhorias que afetam múltiplas User Stories.

- [X] T024 [P] Validar bloqueio de interações no `PlayerCard` — garantir que botões "Negociar", "Lojinha" e o clique no card ficam desabilitados (e visualmente distintos) quando `isTrading=true`
- [X] T025 [P] Validar cancelamento automático — ao clicar em "Finalizar Sessão" (`endSession`), chamar `cancel_session_trades(sessionId)` via RPC antes de atualizar o status da sessão em `ActiveSessionPage.tsx`
- [X] T026 Validar feedback visual de "Pronto" — quando um lado marca pronto e o outro ainda não, mostrar indicador visual claro no `TradeSide.tsx` (ex: badge "Aguardando outro lado...")
- [X] T027 [P] Validar mensagens de erro — garantir que saldo insuficiente de SP e quantidade insuficiente de itens exibem toast/alert claro ao tentar confirmar "Pronto" em `TradeDialog.tsx`
- [ ] T028 Smoke test completo — testar fluxo US1 (player-to-player), US2 (lojinha), US3 (NPC) e US4 (preços) com dois usuários em abas distintas

---

## Dependências & Ordem de Execução

### Dependências de Fase

- **Fase 1 (Setup)**: Sem dependências — pode começar imediatamente
- **Fase 2 (Fundacional)**: Depende da Fase 1 — **BLOQUEIA** todas as User Stories
- **Fase 3 (US1)**: Depende da Fase 2 — MVP entregável após esta fase
- **Fase 4 (US2)**: Depende da Fase 3 (reutiliza `TradeDialog`)
- **Fase 5 (US3)**: Depende da Fase 2 — pode ser desenvolvido em paralelo com Fase 4
- **Fase 6 (US4)**: Depende de T008 (TradeItemSelector) — pode começar após T008
- **Fase 7 (Polish)**: Depende de todas as fases anteriores desejadas

### Dependências entre Tarefas

- T010 depende de T008 e T009
- T013 depende de T010, T011
- T014 depende de T013
- T015 depende de T010
- T016 depende de T012
- T021 depende de T010
- T023 depende de T008

### Oportunidades de Paralelismo

```bash
# Fase 2 — rodar em paralelo:
Task T002: Migração add_price_to_items
Task T003: Migração create_trade_tables
Task T004: Migração create_trade_rpc_functions

# Fase 3 — rodar em paralelo (arquivos distintos):
Task T008: TradeItemSelector.tsx
Task T009: TradeSide.tsx
```

---

## Estratégia de Implementação

### MVP (apenas US1 + US2 — P1 completo)

1. Fase 1: Setup de tipos (T001)
2. Fase 2: Banco de dados + serviço + hook (T002–T007)
3. **APLICAR MIGRAÇÕES** no Supabase Dashboard (T005)
4. Fase 3: US1 — Troca entre jogadores (T008–T014)
5. Fase 4: US2 — Lojinha do Mestre (T015–T018)
6. **VALIDAR**: Dois usuários em abas distintas
7. Entregar MVP

### Entrega Incremental

1. Setup + Fundacional → Base pronta
2. US1 completo → Teste → **MVP!**
3. US2 completo → Teste
4. US3 completo → Teste
5. US4 completo → Teste
6. Polish final

---

## Notas

- `[P]` = arquivos diferentes, sem dependências entre si
- `[Story]` = rastreabilidade com a User Story da spec.md
- Cada User Story é independentemente testável após implementada
- **T005 é manual** — aplicar SQL no Supabase Dashboard pois o CLI local não está disponível
- A coluna `coins` já existe em `characters` — **sem migração necessária** para esse campo
- Seguir padrão de realtime já usado no projeto (`supabase.channel().on('postgres_changes', ...)`)
