# Implementation Plan: Sistema de Negociação e Lojinha

**Branch**: `023-trade-shop-system` | **Date**: 2026-06-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/023-trade-shop-system/spec.md`

## Summary

Implementar um sistema de negociação e lojinha dentro de sessões ativas do RPG Bíblico. O sistema permite trocas de itens e Shekels de Prata (SP) entre jogadores, entre jogadores e NPCs (com o Mestre mediando), e via uma "Lojinha" do Mestre com estoque infinito. Todas as transações são atômicas (via RPC PL/pgSQL) e sincronizadas em tempo real (via Supabase Realtime). Personagens em negociação exibem indicador visual e têm interações bloqueadas.

## Technical Context

**Language/Version**: TypeScript 5.x com React 18

**Primary Dependencies**: React, Supabase Client JS, shadcn/ui (Dialog, Button, Switch), TailwindCSS

**Storage**: Supabase (PostgreSQL 17) — tabelas `trades`, `trade_items` (novas), `items` (extend), `characters`, `character_items` (existentes)

**Testing**: Verificação manual via browser (duas abas/usuários)

**Target Platform**: Web (SPA React com Vite)

**Project Type**: Web application (frontend + Supabase backend)

**Performance Goals**: Sincronização em tempo real < 2s (SC-003)

**Constraints**: Sem timeout de negociação; apenas 1 negociação ativa por personagem (FR-009)

**Scale/Scope**: ~5 jogadores por sessão, ~50 itens no catálogo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Sem Magia Arcana | ✅ Pass | Negociação é mecânica mundana, sem elementos arcanos |
| II. Sem Itens Mágicos | ✅ Pass | Itens trocados são armas/equipamentos da Idade do Bronze/Ferro |
| III. Sistema de Fé | ✅ Pass | Negociação não interfere com o sistema de Fé |
| IV. Tribos como Raças | ✅ Pass | Sem impacto nas tribos |
| V. Regra de Levi | ✅ Pass | Sem impacto |
| VI. Documentação | ✅ Pass | Spec, data-model e plan documentados antes da implementação |

**Re-check pós-design**: ✅ Todos os princípios continuam respeitados.

## Project Structure

### Documentation (this feature)

```text
specs/023-trade-shop-system/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── session/
│       ├── TradeDialog.tsx           # [NEW] Modal principal de negociação (ambos os lados)
│       ├── TradeRequestNotification.tsx # [NEW] Notificação de solicitação de troca
│       ├── TradeSide.tsx             # [NEW] Componente de um lado da negociação
│       ├── TradeItemSelector.tsx     # [NEW] Seletor de itens com busca e preço
│       ├── PlayerCard.tsx            # [MODIFY] Adicionar indicador "Negociando" + botões
│       ├── SessionParticipantList.tsx # [MODIFY] Passar estado de trades + handlers
│       └── SessionNPCList.tsx        # [MODIFY] Adicionar botão "Negociar" nos NPCs
├── hooks/
│   └── useSessionTrades.ts          # [NEW] Hook de negociações com realtime
├── services/
│   └── tradeService.ts              # [NEW] Serviço de negociação (CRUD + RPC calls)
├── pages/
│   └── session/
│       └── ActiveSessionPage.tsx    # [MODIFY] Integrar trade system
└── types/
    └── trade.ts                     # [NEW] Tipos TypeScript para trades

supabase/
└── migrations/
    ├── XXXXXX_add_price_to_items.sql          # [NEW] Adicionar coluna price à tabela items
    ├── XXXXXX_create_trade_tables.sql         # [NEW] Tabelas trades + trade_items + RLS
    └── XXXXXX_create_trade_rpc_functions.sql  # [NEW] RPCs execute_trade + cancel_session_trades
```

**Structure Decision**: Seguir o padrão existente do projeto — componentes em `components/session/`, hooks em `hooks/`, serviços em `services/`, tipos em `types/`. Novas tabelas via migrações Supabase.

## Fases de Implementação

### Fase 1: Backend (Banco de Dados)
1. Migração: Adicionar coluna `price` (integer, null) à tabela `items`
2. Migração: Criar tabelas `trades` e `trade_items` com RLS e realtime
3. Migração: Criar RPCs `execute_trade` e `cancel_session_trades`
4. Aplicar migrações via Supabase Dashboard

### Fase 2: Tipos e Serviços
5. Criar tipos TypeScript (`Trade`, `TradeItem`, `TradeType`, `TradeStatus`)
6. Criar `tradeService.ts` (CRUD de trades/items, chamadas às RPCs)
7. Criar `useSessionTrades.ts` (hook com realtime subscription)

### Fase 3: Componentes UI
8. Criar `TradeItemSelector.tsx` (seletor de itens com busca, preço, quantidade)
9. Criar `TradeSide.tsx` (um lado da negociação com itens + SP + botão Pronto)
10. Criar `TradeDialog.tsx` (modal completo com dois lados, botões Cancelar/Pronto)
11. Criar `TradeRequestNotification.tsx` (popup de aceitar/recusar trade)

### Fase 4: Integração
12. Modificar `PlayerCard.tsx` — indicador "Negociando" + botão "Negociar" / "Lojinha"
13. Modificar `SessionParticipantList.tsx` — passar trades ativas, handlers
14. Modificar `SessionNPCList.tsx` — botão "Negociar" em NPCs visíveis
15. Modificar `ActiveSessionPage.tsx` — integrar hook, dialogs, notificações

### Fase 5: Validação
16. Testar fluxo completo com duas abas (GM + jogador)
17. Verificar bloqueio de interações durante negociação
18. Verificar cancelamento ao encerrar sessão

## Complexity Tracking

Sem violações de constituição. Complexidade justificada pela natureza transacional (RPC atômica) e tempo real (Supabase channels) — padrões já existentes no projeto.
