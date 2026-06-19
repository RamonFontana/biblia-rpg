# Tasks: Sistema de Combate - Teste de Morte e Fim de Combate

**Input**: Design documents from `/specs/027-combat-death-saves/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T001 Update Supabase database schema adding `death_saves_successes`, `death_saves_failures`, `is_stable`, `is_dead`, and `is_deleted` to the `characters` table.
- [x] T002 Update TypeScript types in `src/types/database.types.ts` to reflect the new character fields.
- [x] T003 Create database helper functions/hooks for updating character death save states.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 2: User Story 1 - Fim de Combate (Priority: P1)

**Goal**: Permitir que o mestre finalize o combate e retorne a sessão ao estado normal.

**Independent Test**: Clicar em "Finalizar Combate" altera o status da sessão de combate para 'finished' e os componentes de jogadores e do mestre voltam para a tela de exploração.

### Implementation for User Story 1

- [x] T004 [US1] Add "Finalizar Combate" button to `src/components/combat/CombatDashboard.tsx`.
- [x] T005 [US1] Implement combat end logic to update `combat_sessions` status to `finished`.
- [x] T006 [US1] Update `src/pages/session/ActiveSessionPage.tsx` to listen for combat end and transition participants out of the combat view.

**Checkpoint**: O combate pode ser finalizado e a interface atualizada para todos os participantes em tempo real.

---

## Phase 3: User Story 2, 3 & 4 - Sistema de Teste de Morte (Jogador) (Priority: P1)

**Goal**: Exibir a tela de Teste de Morte para o jogador quando HP chegar a 0, permitindo rolagens e resolvendo a vida/morte do personagem.

**Independent Test**: Zere a vida do personagem. O modal de morte deve aparecer, rolagens devem atualizar os marcadores e, ao alcançar 3 falhas ou 3 sucessos, o status do personagem (morto ou estável) deve mudar.

### Implementation for Player Interface
- [x] T007 [US2] Create a new component `src/components/combat/DeathSavesModal.tsx` showing failures, successes, and the dice input/roll button.
- [x] T008 [US2] Integrate `DeathSavesModal.tsx` into `src/components/combat/PlayerCombatView.tsx` triggering when `current_hp <= 0`.
- [x] T009 [US3] Implement manual and automatic d20 roll inputs in `DeathSavesModal.tsx`.
- [x] T010 [US3] Implement death save rules logic (1 = 2 failures, 2-9 = 1 failure, 10-19 = 1 success, 20 = +1 HP and awake) updating the database.
- [x] T011 [US4] Implement stabilization logic (3 successes -> `is_stable = true`).
- [x] T012 [US4] Implement death logic (3 failures -> `is_dead = true`).

**Checkpoint**: Jogadores podem morrer, estabilizar ou reviver criticamente usando sua própria interface.

---

## Phase 4: User Story 5 - Controle do Mestre (Priority: P2)

**Goal**: Fornecer ao mestre os controles necessários para forçar sucessos, falhas, curar aliados caídos e decretar morte instantânea.

**Independent Test**: O Mestre utiliza o painel no personagem morrendo para manipular falhas/sucessos. O Mestre usa a ação Levantar e os status são resetados.

### Implementation for Master Controls
- [x] T013 [US5] Add a new sub-menu or modal `MasterDeathControls.tsx` accessible from `CombatDashboard.tsx` when a participant reaches `hp_current <= 0`.
- [x] T014 [US5] Add buttons for the Master to manually increment successes/failures, forcing database updates via `useDeathSaves.ts`.
- [x] T015 [US5] Add an "Insta-Kill" button for the Master, setting `is_dead = true` and `failures = 3`.
- [x] T016 [US5] Add a "Levantar" (Heal) button accessible to players on allies or to the Master. For simplicity as specified in US5 clarification, Master controls the action: resets failures/successes and adds 1 HP.
- [x] T017 [US5] Ensure resetting stats via heal updates both the `characters` table and `combat_participants` HP.

**Checkpoint**: O Mestre tem controle total sobre a vida, morte e estabilização dos jogadores.

---

## Phase 5: Soft Delete & Modo Espectador (Priority: P2)

**Goal**: Executar a limpeza lógica dos personagens mortos apenas no fim da batalha e mantê-los como espectadores.

**Independent Test**: Finalizar um combate contendo um jogador morto marca-o como deletado no banco de dados. O jogador morto consegue ver a sessão ativa como espectador.

### Implementation for Soft Delete & Spectator

- [x] T018 [US6] Update the "Finalizar Combate" logic from T005 to perform soft delete (`is_deleted = true`) on all characters with `is_dead == true`.
- [x] T019 [US6] Update `src/pages/session/ActiveSessionPage.tsx` to provide a spectator view for users whose active character has `is_deleted == true`.
- [x] T020 [US6] Ensure soft deleted characters are filtered out from future combat selections and active lists.

---

## Dependencies & Execution Order

- **Foundational (Phase 1)**: BLOCKS all user stories. Must be completed first to provide schema.
- **User Story 1 (Phase 2)**: Can be done independently after Phase 1.
- **User Story 2,3,4 (Phase 3)**: Can be done independently after Phase 1.
- **User Story 5 (Phase 4)**: Depends on the UI and concepts established in Phase 3, but specifically modifies the master's view.
- **Soft Delete (Phase 5)**: Depends on User Story 1 (Fim de Combate) and User Story 4 (is_dead field state).
