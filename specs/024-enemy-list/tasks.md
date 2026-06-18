# Tasks: Enemy List

**Input**: Design documents from `/specs/024-enemy-list/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create database migration to add `is_enemy` boolean to `characters` table in Supabase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implement `useSessionEnemies` hook in `src/hooks/useSessionEnemies.ts` to fetch session characters where `is_enemy` is true

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Master Views Enemy List & Enemy Creation (Priority: P1) 🎯 MVP

**Goal**: The Game Master can access a private list of enemies and create new enemies defining their attributes and optionally uploading a base64 image.

**Independent Test**: Can be tested by logging in as Master, creating an enemy with attributes/image, and seeing it appear in the Enemy List section on the active session page.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create `CreateEnemyDialog` in `src/components/session/CreateEnemyDialog.tsx` with inputs for attributes and base64 image upload
- [x] T004 [US1] Create `SessionEnemyList` in `src/components/session/SessionEnemyList.tsx` that integrates `CreateEnemyDialog` and lists fetched enemies
- [x] T005 [US1] Integrate `SessionEnemyList` into `src/pages/session/ActiveSessionPage.tsx` replacing the "Controle de combate em breve..." placeholder

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Enemy Character Sheet Management (Priority: P1)

**Goal**: Each enemy has a standard character sheet just like players.

**Independent Test**: Can be tested by clicking on an enemy in the list and verifying the standard character sheet modal opens and works.

### Implementation for User Story 2

- [x] T006 [US2] Update `SessionEnemyList` in `src/components/session/SessionEnemyList.tsx` to handle click events and open the existing `CharacterSheetView` modal for the selected enemy

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Item Management Customization (Priority: P2)

**Goal**: Hide "Negotiate" and "Toggle Visibility" buttons for enemies, as their items are managed solely by the GM without player interaction.

**Independent Test**: Verify that viewing an enemy character sheet or list item as GM does not show "Negotiate" or "Toggle Visibility" options.

### Implementation for User Story 3

- [x] T007 [US3] Inspect and modify components to conditionally hide "Negotiate" and "Toggle Visibility" buttons when the character has `is_enemy === true`. (Note: Implemented by omitting them from `SessionEnemyList` entirely).

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T008 [P] Documentation updates (if applicable)
- [ ] T009 Code cleanup and refactoring
- [ ] T010 Run quickstart.md validation to ensure everything works end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after User Story 1 - Integrates sheet viewing into the list
- **User Story 3 (P2)**: Can start after User Story 2 - Modifies the sheet view slightly

### Within Each User Story

- Components are built first, then integrated into their parents
- Story complete before moving to next priority

### Parallel Opportunities

- T003 (CreateEnemyDialog) can be worked on in parallel with T002 (useSessionEnemies) if the schema is known.
- T007 (Modifying inventory view) can be worked on independently of the enemy list components.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
