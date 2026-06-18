# Tasks: Controle de Descansos da Sessão (Mestre)

**Input**: Design documents from `/specs/021-session-rest-controls/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify project structure and Supabase connection

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Create Supabase migration to add `short_rests_today` and `last_long_rest_day` to `game_sessions` table in `supabase/migrations/[timestamp]_add_rest_controls.sql`
- [ ] T003 Apply Supabase migration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Aplicar Descanso Curto (Priority: P1) 🎯 MVP

**Goal**: Permitir que o mestre aplique descanso curto para o grupo (limite de 2/dia).

**Independent Test**: Clicar no botão "Descanso Curto" como Mestre e verificar se o contador incrementa e a disponibilidade atualiza para os jogadores. Virar o dia no jogo e verificar o reset.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Create `PlayerRestIndicator` component structure in `src/components/session/PlayerRestIndicator.tsx` (apenas para Descanso Curto)
- [ ] T005 [P] [US1] Create `SessionRestControls` component with Descanso Curto button in `src/components/session/SessionRestControls.tsx`
- [ ] T006 [US1] Inject `PlayerRestIndicator` and `SessionRestControls` into `src/pages/session/ActiveSessionPage.tsx`
- [ ] T007 [US1] Update `advanceTime` logic in `src/pages/session/ActiveSessionPage.tsx` to reset `short_rests_today` to 0

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Aplicar Descanso Longo (Priority: P1)

**Goal**: Permitir que o mestre aplique descanso longo para o grupo (limite de 1 a cada 2 dias), restaurando PV e Fé.

**Independent Test**: Trigger a Long Rest as Game Master and verify players get healed, Faith updates, and the 2-day cooldown is respected.

### Implementation for User Story 2

- [ ] T008 [US2] Update `SessionRestControls` to include Descanso Longo button in `src/components/session/SessionRestControls.tsx`
- [ ] T009 [US2] Add logic to `SessionRestControls.tsx` to recover HP (PV) and Faith for all players via Supabase RPC or batch update
- [ ] T010 [US2] Update `PlayerRestIndicator.tsx` to display Long Rest availability

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T011 Check styling and layout for the new components (Tailwind CSS)
- [ ] T012 Validate error handling if Supabase calls fail

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Expands on the components created in US1

### Parallel Opportunities

- T004 and T005 can be implemented in parallel.
