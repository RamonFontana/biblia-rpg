---
description: "Task list template for feature implementation: Efeitos e Condições"
---

# Tasks: Efeitos e Condições (042-effects-conditions)

**Input**: Design documents from `/specs/042-effects-conditions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Install `shadcn/ui` components: `badge`, `dropdown-menu`, `dialog`
- [x] T002 Configure Supabase Client em `src/lib/supabase.ts` (ou equivalente) para garantir que suporte canais Real-time

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Atualizar o arquivo de tipos do banco `src/types/database.types.ts` para refletir o JSON `conditions` em `characters` e `combat_participants`
- [x] T004 [P] Criar a interface `ConditionEntry` em `src/types/combat.ts` (contendo `conditionId`, `duration`)
- [x] T005 Implementar o serviço de lógica de condições em `src/services/conditionsService.ts` contendo as regras de sobrescrita e manipulação de estado

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Mestre aplica condição manualmente (Priority: P1) 🎯 MVP

**Goal**: O Mestre consegue aplicar condições aos personagens, que refletem em tempo real graças ao Supabase Real-time e interface shadcn.

### Implementation for User Story 1

- [x] T006 [P] [US1] Criar componente base `src/components/conditions/ConditionBadge.tsx` utilizando o Badge do shadcn
- [x] T007 [P] [US1] Criar componente `src/components/conditions/ConditionSelector.tsx` para o Mestre aplicar efeitos com duração
- [x] T008 [US1] Modificar `src/stores/useCharacterStore.ts` (ou similar) para escutar as mudanças Real-time na tabela `characters`
- [x] T009 [US1] Integrar o `ConditionSelector` e `ConditionBadge` na Ficha Global / Painel do Mestre (`src/pages/MasterPanel.tsx` ou similar)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Sincronização Combate (Priority: P2)

**Goal**: As condições transitam adequadamente quando um personagem entra ou sai de um combate, salvando as persistentes e limpando as temporárias.

### Implementation for User Story 2

- [x] T010 [P] [US2] Modificar lógica de "Iniciar Combate" no store para importar condições ativas (`src/stores/useCombatStore.ts`)
- [x] T011 [P] [US2] Modificar lógica de "Encerrar Combate" para salvar condições permanentes e limpar temporárias na tabela `characters`
- [x] T012 [US2] Atualizar o store de combate para escutar eventos Real-time da tabela `combat_participants` e renderizar os `ConditionBadge` no Tracker de Iniciativa

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Automação de Habilidades (Priority: P3)

**Goal**: O sistema aplica automaticamente condições configuradas no payload das habilidades após o cálculo do ataque.

### Implementation for User Story 3

- [x] T013 [P] [US3] Atualizar a definição de tipos de habilidades em `src/data/abilities.ts` adicionando `applyConditions` no objeto `mechanics`
- [x] T014 [US3] Inserir regra de automação no motor de combate (ex: `src/services/combatEngine.ts`) para ler `applyConditions` no momento do acerto (OnHit) e aplicar via `conditionsService.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T015 [P] Ajustar responsividade do wrap de múltiplos badges na Ficha do Personagem
- [x] T016 Testar limite de exibição e truncamento de nomes de condições

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): MVP.
  - User Story 2 (P2): Depende das interfaces do US1 prontas.
  - User Story 3 (P3): Opcional, depende do motor de combate.

### Parallel Opportunities

- As definições de tipos (T004) e UI base (T006, T007) podem ser feitas paralelamente.
- Modificações de stores (T008, T010, T011) requerem que o `ConditionEntry` esteja definido, mas rodam em paralelo entre Ficha Global e Ficha de Combate.

## Implementation Strategy

### Incremental Delivery

1. Setup + Foundation → Estruturas e pacotes prontos.
2. User Story 1 → O Mestre consegue alterar o BD via UI e o feedback Real-time brilha. (MVP)
3. User Story 2 → Combates fluem com os estados sincronizados.
4. User Story 3 → Ataques com sangramento se tornam automáticos.
