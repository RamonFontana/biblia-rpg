# Tasks: Session Player Tests

**Input**: Design documents from `/specs/018-session-player-tests/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(N/A for this feature as it is integrated into an existing project. Proceed to Foundational).*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create database migration for `session_tests` and `session_test_results` tables in `supabase/migrations/20260617000000_create_session_tests.sql`
- [x] T002 [P] Implement data layer operations in `src/services/sessionTestService.ts`
- [x] T003 Implement React hook for subscribing to realtime changes in `src/hooks/useSessionTests.ts` (depends on T002)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Mestre Inicia Teste com Jogadores (Priority: P1) 🎯 MVP

**Goal**: O Mestre, durante uma sessão ativa, decide solicitar um teste para um ou mais jogadores e envia a requisição.

**Independent Test**: O Mestre consegue abrir a interface de testes, selecionar um teste, selecionar os jogadores alvo e enviar o valor de dificuldade com sucesso.

### Implementation for User Story 1

- [x] T004 [US1] Create the `MasterTestDialog` component for the initiator form in `src/components/session/MasterTestDialog.tsx`
- [x] T005 [US1] Add the trigger button to open the test dialog in the master view (e.g., above character cards in the session view) in `src/components/session/SessionView.tsx` (or equivalent master view component)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. The Master can create a test and save it to the DB.

---

## Phase 4: User Story 2 - Jogadores Respondem ao Teste (Priority: P1)

**Goal**: Os jogadores selecionados recebem o teste enviado pelo Mestre, visualizam a dificuldade, rolam seus dados e inserem o resultado obtido.

**Independent Test**: Um jogador selecionado consegue ver o dialog do teste em tempo real, visualizar a dificuldade e inserir e enviar o seu próprio resultado.

### Implementation for User Story 2

- [x] T006 [US2] Create the `PlayerTestDialog` component for the player's input form in `src/components/session/PlayerTestDialog.tsx`
- [x] T007 [US2] Integrate the `PlayerTestDialog` into the main session view for players so it auto-opens on pending tests.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Master sends -> Player receives and answers.

---

## Phase 5: User Story 3 - Mestre Acompanha e Vê Resultados dos Testes (Priority: P1)

**Goal**: O Mestre vê os resultados de cada jogador em uma tela de acompanhamento em tempo real, com aprovação/reprovação automática. Outros jogadores veem o status de "ocupado" de quem está testando.

**Independent Test**: O Mestre consegue ver a tela atualizada com as respostas, aprovados e reprovados. Jogadores inativos veem o ícone de ocupado.

### Implementation for User Story 3

- [x] T008 [US3] Expand `MasterTestDialog` to support the dashboard/results view state in `src/components/session/MasterTestDialog.tsx`
- [x] T009 [US3] Update character cards to show a "busy/testing" status when the player has a pending test in `src/components/session/CharacterCard.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Test end-to-end flow manually using two browser windows (Master and Player) to verify real-time sync latency.
- [x] T011 Run quickstart.md validation to ensure the documented test steps work correctly.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: BLOCKS all user stories. Must be done first to provide the Supabase Realtime backend.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 must be implemented to test User Story 2 realistically (though US2 can be mocked).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 (needs a test to exist).
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1/US2.

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (e.g. data service can be written while migration is drafted).
- The `PlayerTestDialog` (US2) can be designed in parallel with the `MasterTestDialog` (US1) if using mocked data.

---

## Implementation Strategy

### Incremental Delivery

1. Complete Foundational → DB and Hooks ready.
2. Add User Story 1 → Master can initiate tests.
3. Add User Story 2 → Players can receive and answer tests.
4. Add User Story 3 → Master sees the final dashboard and busy status is visible.
5. Polish and verify the end-to-end real-time loop.
