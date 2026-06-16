description: "Task list template for feature implementation"
---

# Tasks: Session Character Sheet

**Input**: Design documents from `/specs/014-session-character-sheet/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create component directories `src/components/character`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create base `PlayerCard` component in `src/components/session/PlayerCard.tsx`
- [x] T003 [P] Create skeleton `CharacterSheetView` component in `src/components/character/CharacterSheetView.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Master Views Player Character Sheet (Priority: P1) 🎯 MVP

**Goal**: The GM needs to be able to see the full character sheet of any online player to manage the game.

**Independent Test**: GM logs into an active session, sees the improved player list, clicks on a player, and views their character sheet in a modal/sheet.

### Implementation for User Story 1

- [x] T004 [P] [US1] Refactor `src/components/session/OnlinePlayersList.tsx` to use `PlayerCard.tsx` for listing players.
- [x] T005 [US1] Implement character data fetching and UI display in `src/components/character/CharacterSheetView.tsx`.
- [x] T006 [US1] Add a modal/sheet wrapper in `src/components/session/OnlinePlayersList.tsx` that opens when the GM clicks a player card, rendering the `CharacterSheetView`.
- [x] T007 [US1] Ensure `src/pages/session/ActiveSessionPage.tsx` correctly passes the GM role context to `OnlinePlayersList.tsx` to enable clicking.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Player Views Their Own Character Sheet (Priority: P1)

**Goal**: Players need to see their own character sheet during the active session.

**Independent Test**: Player logs into an active session, sees their own character summary in the "Seu Personagem" area, and can expand it to see the full sheet.

### Implementation for User Story 2

- [x] T008 [P] [US2] Update the "Visão do Jogador" section in `src/pages/session/ActiveSessionPage.tsx` to render `CharacterSheetView` for the current user.
- [x] T009 [US2] Ensure `OnlinePlayersList.tsx` restricts normal players from opening other players' character sheets (clicking disabled).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 [P] Final UI review for responsiveness in `src/components/character/CharacterSheetView.tsx`
- [x] T011 [P] Ensure correct typing for Supabase queries in `src/components/character/CharacterSheetView.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 2 (P1) can proceed in parallel or sequentially.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent from US1.

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Once Foundational phase completes, User Story 1 and User Story 2 can start in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP!
3. Add User Story 2 → Test independently
4. Each story adds value without breaking previous stories
