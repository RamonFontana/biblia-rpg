# Tasks: combat-system

**Input**: Design documents from `/specs/026-combat-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/zod-schemas.md, quickstart.md

**Tests**: Testes descritos aqui focam na validação manual conforme o `quickstart.md`, uma vez que testes automatizados de end-to-end não foram solicitados, garantimos os testes estáticos (TypeScript) e schemas (Zod).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create initial Zod schemas and Types in src/types/combat.ts based on contracts/zod-schemas.md
- [x] T002 [P] Configure basic Supabase Realtime client utility in src/lib/supabase/client.ts (se ainda não existir)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create database migrations for `combats` and `combat_participants` tables in supabase/migrations/
- [x] T004 Implement base Zustand store skeleton in src/store/combatStore.ts with Supabase Realtime subscriptions logic
- [x] T005 [P] Implement core store actions (`setCombatState`) in src/store/combatStore.ts

**Checkpoint**: Foundation ready - Realtime engine is connected and DB is ready.

---

## Phase 3: User Story 1 - Setup do Combate (Priority: P1) 🎯 MVP

**Goal**: Permitir ao Mestre selecionar os participantes do combate e definir a ordem de iniciativa via formulário validado.

**Independent Test**: Mestre consegue abrir o modal, inserir iniciativas e visualizar o combate iniciando no banco de dados.

### Implementation for User Story 1

- [x] T006 [US1] Create `CombatSetupModal` component skeleton in src/components/combat/CombatSetupModal.tsx
- [x] T007 [US1] Integrate `CombatSetupModal` with Shadcn Form, React Hook Form, and `CombatSetupSchema` in src/components/combat/CombatSetupModal.tsx
- [x] T008 [US1] Implement store action `startCombat` in src/store/combatStore.ts to insert combat rows
- [x] T009 [US1] Wire the modal form submission to `startCombat` action in src/components/combat/CombatSetupModal.tsx

**Checkpoint**: User Story 1 (Setup) is fully functional. Combat rows can be created in DB.

---

## Phase 4: User Story 2 - Acompanhamento do Turno do Mestre (Priority: P1)

**Goal**: Painel de controle para o Mestre gerenciar turnos, HP e condições de forma sincronizada.

**Independent Test**: Mestre consegue ver a lista de iniciativa, avançar o turno e aplicar dano, e o DB reflete as mudanças.

### Implementation for User Story 2

- [x] T010 [P] [US2] Create `CombatDashboard` component in src/components/combat/CombatDashboard.tsx
- [x] T011 [P] [US2] Create initiative list UI and turn indicators in src/components/combat/CombatDashboard.tsx
- [x] T012 [US2] Create `HealthModificationModal` using Shadcn Form and `HealthModificationSchema` in src/components/combat/HealthModificationModal.tsx
- [x] T013 [US2] Implement store actions `nextTurn`, `applyDamageOrHealing`, and `updateConditions` in src/store/combatStore.ts
- [x] T014 [US2] Wire the UI actions in `CombatDashboard` to the Zustand store mutations

**Checkpoint**: User Story 2 is functional. DM has full control over the combat state.

---

## Phase 5: User Story 3 - Visão do Jogador e Checklist de Ações (Priority: P2)

**Goal**: Exibir para o jogador o turno atual de forma sincronizada e um tracker de ações visual (Movimento, Ação, Bônus, Reação).

**Independent Test**: Jogador visualiza as mudanças de turno comandadas pelo Mestre e consegue interagir com seu checklist local.

### Implementation for User Story 3

- [x] T015 [P] [US3] Create `PlayerCombatView` component in src/components/combat/PlayerCombatView.tsx
- [x] T016 [US3] Implement local slice in Zustand store for the checklist (`hasUsedMovement`, etc.) in src/store/combatStore.ts
- [x] T017 [US3] Add "My Turn" prominent banner logic reacting to `current_turn_index` in src/components/combat/PlayerCombatView.tsx
- [x] T018 [US3] Connect local checklist actions (toggle) and auto-reset when turn cycles back in src/components/combat/PlayerCombatView.tsx

**Checkpoint**: User Story 3 is functional. Players have an interactive visual aid synchronized with the DM.

---

## Phase 6: User Story 4 - Resolução Híbrida de Rolagens (Priority: P2)

**Goal**: Permitir que o Jogador insira resultados de rolagens físicas de mesa no app para processamento pelo Mestre.

**Independent Test**: Jogador insere um input de dado físico e isso atualiza as tabelas de estado (ou envia um log para o Mestre).

### Implementation for User Story 4

- [x] T019 [US4] Create `PhysicalRollForm` component using Shadcn Form and `PhysicalRollSchema` in src/components/combat/PhysicalRollForm.tsx
- [x] T020 [US4] Integrate the form submission to send damage/result commands to the `combatStore` in src/components/combat/PhysicalRollForm.tsx
- [x] T021 [US4] Embed the `PhysicalRollForm` into the `PlayerCombatView` layout in src/components/combat/PlayerCombatView.tsx

**Checkpoint**: All user stories are functionally implemented.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Refine responsive layouts (Tailwind constraints) for mobile devices in all components
- [x] T023 Run quickstart.md manual validation steps to ensure End-to-End Realtime Sync
- [x] T024 Error handling and toasts for Supabase mutations failures in src/store/combatStore.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (US1 → US2 → US3 → US4)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Depends on US1 (precisa do combate criado para controlar turnos)
- **User Story 3 (P2)**: Depends on US2 (precisa do Mestre controlando o `current_turn_index` para ver a mudança de turno)
- **User Story 4 (P2)**: Depends on US3 (se integra visualmente na visão do jogador)

### Parallel Opportunities

- T001 and T002 in Setup can be done in parallel.
- T010 and T011 in US2 can be done in parallel.
- T015 and T016 in US3 can be done in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2 (Foundation)
2. Complete Phase 3 (US1: Combat Setup)
3. Complete Phase 4 (US2: DM Dashboard)
4. **STOP and VALIDATE**: Teste na tela do Mestre criando um combate e manipulando.
5. Deliver MVP.

### Incremental Delivery

1. Add Phase 5 (US3: Player View & Checklist) → Validate Realtime Sync with 2 users.
2. Add Phase 6 (US4: Physical Rolls Integration).
3. Finish with Phase 7 (Polish & Responsive adjustments).
