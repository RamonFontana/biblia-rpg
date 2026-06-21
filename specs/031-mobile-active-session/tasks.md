# Tasks: mobile-active-session

**Input**: Design documents from `/specs/031-mobile-active-session/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install `dropdown-menu` component from shadcn/ui by running `npx shadcn-ui@latest add dropdown-menu`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Import `DropdownMenu` components into `src/pages/session/ActiveSessionPage.tsx` and structure the mobile layout skeleton for the header.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Player View on Mobile (Priority: P1) 🎯 MVP

**Goal**: Adjust the player view so the character sheet and participants list display properly on mobile without overflowing.

**Independent Test**: Load a session as a Player on a mobile viewport and verify character sheet takes full width and participant list stacks below it.

### Implementation for User Story 1

- [x] T003 [US1] Update CharacterSheetView layout container in `src/pages/session/ActiveSessionPage.tsx` to use a single column on mobile (ensure `grid-cols-1 lg:grid-cols-3` wraps properly).
- [x] T004 [US1] Update `SessionParticipantList` layout inside Player view in `src/pages/session/ActiveSessionPage.tsx` to stack vertically on mobile.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - GM View on Mobile (Priority: P1)

**Goal**: Group GM controls in a dropdown menu and stack participant grids for GMs on mobile.

**Independent Test**: Load a session as a GM on mobile viewport, check if header buttons are accessible via the DropdownMenu and lists stack correctly.

### Implementation for User Story 2

- [x] T005 [US2] Wrap GM header buttons ("Avançar Tempo", "Solicitar Teste", "Iniciar Combate") into the `DropdownMenu` inside `src/pages/session/ActiveSessionPage.tsx` for small screens, while keeping them visible on `md` screens.
- [x] T006 [US2] Update GM middle content grids (`SessionParticipantList`, `SessionEnemyList`, `SessionNPCList`) in `src/pages/session/ActiveSessionPage.tsx` to use `grid-cols-1 md:grid-cols-3`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Modals on Mobile (Priority: P2)

**Goal**: Ensure all modals (Test, Dice, Combat) fit within the mobile viewport width and are scrollable.

**Independent Test**: Open each modal on a mobile viewport and verify no horizontal scroll is forced.

### Implementation for User Story 3

- [x] T007 [P] [US3] Verify and fix `MasterTestDialog` width/overflow classes in `src/components/session/MasterTestDialog.tsx` if needed.
- [x] T008 [P] [US3] Verify and fix `PlayerTestDialog` width/overflow classes in `src/components/session/PlayerTestDialog.tsx` if needed.
- [x] T009 [P] [US3] Verify and fix `DiceRollerDialog` width/overflow classes in `src/components/session/DiceRollerDialog.tsx` if needed.
- [x] T010 [P] [US3] Verify and fix `CombatSetupModal` width/overflow classes in `src/components/combat/CombatSetupModal.tsx` if needed.
- [x] T011 [P] [US3] Verify and fix `TradeDialog` width/overflow classes in `src/components/session/TradeDialog.tsx` if needed.

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Run quickstart.md validation to ensure everything is responsive.
- [x] T013 Check for horizontal overflow (`overflow-x-hidden`) on the body level in `src/pages/session/ActiveSessionPage.tsx` just in case.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can be developed in parallel with US1.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Can be developed in parallel with US1 and US2.

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Modals fixes in US3 can all run in parallel since they touch different files.
- US1 and US2 touch the same file (`ActiveSessionPage.tsx`) so they should be done sequentially if done by the same developer.

---

## Parallel Example: User Story 3

```bash
# Launch all modal fixes for User Story 3 together:
Task: "Verify and fix MasterTestDialog width/overflow classes"
Task: "Verify and fix PlayerTestDialog width/overflow classes"
Task: "Verify and fix CombatSetupModal width/overflow classes"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
