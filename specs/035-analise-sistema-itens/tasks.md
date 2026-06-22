# Tasks: Análise e Melhorias no Sistema de Itens

**Input**: Design documents from `/specs/035-analise-sistema-itens/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)
*N/A - Project already set up.*

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T001 Adicionar campos de propriedades `properties` e `statPenalty` na interface `ItemEffects` (implícita ou criada) e atualizar parse em `src/features/character-management/api/syncInventory.ts`

---

## Phase 3: User Story 1 - Suporte a Propriedades Especiais de Armas (Priority: P1) 🎯 MVP

**Goal**: Propriedades como Versátil e Acuidade afetam os modificadores de ataque e dano automaticamente.
**Independent Test**: Equipar arma Versátil com 2 mãos e o dano alterar; atacar com arma Acuidade usando Destreza.

### Implementation for User Story 1

- [x] T002 [P] [US1] Adicionar `properties: ['versatile', 'finesse']` aos respectivos itens no array `ITEMS_DB` em `src/data/itemsDb.ts`
- [x] T003 [US1] Atualizar `getEffectsFromItemName` em `src/features/character-management/api/syncInventory.ts` para capturar `properties` dos itens
- [x] T004 [US1] Adicionar botão "Equipar (Duas Mãos)" para armas Versáteis no inventário em `src/components/inventory/InventoryList.tsx`
- [x] T005 [US1] Modificar o cálculo de status de ataque em `src/components/inventory/InventoryList.tsx` para respeitar Acuidade e Empunhadura Dupla

---

## Phase 4: User Story 2 - Gerenciamento de Munições (Priority: P1)

**Goal**: Permitir gerenciar munições em ataques à distância.
**Independent Test**: Usar arco e ver a contagem de flechas reduzir.

### Implementation for User Story 2

- [x] T006 [P] [US2] Adicionar item "Flechas" (tipo Consumível) no array `ITEMS_DB` em `src/data/itemsDb.ts`
- [x] T007 [US2] Adicionar lógica para deduzir quantidade do consumível ao acionar botão "Usar" em munição na UI de inventário em `src/components/inventory/InventoryList.tsx`

---

## Phase 5: User Story 3 - Penalidades e Restrições de Armadura (Priority: P2)

**Goal**: Armaduras pesadas impõem Desvantagem em Furtividade/Destreza.
**Independent Test**: Tentar fazer teste de Destreza com Lorica e ver alerta de desvantagem.

### Implementation for User Story 3

- [x] T008 [P] [US3] Adicionar `properties: ['stealth_disadvantage']` em armaduras relevantes no array `ITEMS_DB` em `src/data/itemsDb.ts`
- [x] T009 [US3] Ler `stealth_disadvantage` de itens equipados e renderizar alerta visual de "Desvantagem neste teste" em `src/components/session/PlayerTestDialog.tsx` caso o teste seja baseado em Destreza

---

## Phase 6: User Story 4 - Implementação do Símbolo Proibido (Priority: P3)

**Goal**: Amuleto Proibido reduz Fé do personagem passivamente.
**Independent Test**: Ter Símbolo Proibido no inventário diminui Fé máxima ou atual.

### Implementation for User Story 4

- [x] T010 [P] [US4] Adicionar item "Amuleto/Símbolo (Proibido)" no array `ITEMS_DB` com `effects.statPenalty = { stat: 'faith', value: -10, type: 'passive' }` em `src/data/itemsDb.ts`
- [x] T011 [US4] Exibir decréscimo de Fé na interface `src/components/session/PlayerTestDialog.tsx` ou deduzir isso do score total ao checar status.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T012 Revisar alinhamento visual dos alertas de desvantagem em dispositivos mobile em `src/components/session/PlayerTestDialog.tsx`

---

## Dependencies & Execution Order

- **Foundational**: Modificar interface de efeitos (T001) para desbloquear US1, US3, US4.
- **US1 (P1)**: Depende do T001.
- **US2 (P1)**: Sem dependências de US1.
- **US3 (P2)**: Depende do T001.
- **US4 (P3)**: Depende do T001.

### Parallel Opportunities

- T002, T006, T008, T010 podem ser feitos paralelamente pois alteram entradas independentes em `src/data/itemsDb.ts`.
