# Tasks: Session Character List Improvement

**Input**: Design documents from `/specs/022-session-character-list/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Supabase migration to add `is_visible` (boolean, default false) to `session_npcs` table.
- [x] T002 Update RLS policies in the migration to allow players to only see NPCs with `is_visible = true`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update frontend data models to support `is_visible` on `session_npcs` and the unified `SessionListEntry` interface.
- [x] T004 Update Supabase data fetching and subscription logic in `src/store/useSessionStore.ts` to include `is_visible`.

**Checkpoint**: Foundation ready - database schema and store logic are prepared.

---

## Phase 3: User Story 1 - Differentiated Character Listing (Priority: P1) 🎯 MVP

**Goal**: See participants divided into Master, NPCs, and Player Characters. Display character name as main text and player name as subtitle.

**Independent Test**: Join a session as a player and verify distinct sections and name formatting.

### Implementation for User Story 1

- [x] T005 [US1] Rename UI labels from "Jogadores" to "Personagens" in `src/pages/session/ActiveSessionPage.tsx` and related components.
- [x] T006 [US1] Refactor `src/components/session/SessionParticipantList.tsx` to group the list into Master, Characters, and NPCs.
- [x] T007 [US1] Update `src/components/session/SessionCharacterCard.tsx` to display Character Name as primary text and Player Name as subtitle.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Master Control over NPC Visibility (Priority: P1)

**Goal**: Master can show/hide individual NPCs from players.

**Independent Test**: Master creates/toggles NPC visibility and verifies it appears/disappears on the player's screen.

### Implementation for User Story 2

- [x] T008 [US2] Add visibility toggle (eye icon) to NPC cards for the Master in `src/components/session/SessionCharacterCard.tsx`.
- [x] T009 [US2] Implement the toggle action to update `is_visible` in Supabase via `src/store/useSessionStore.ts` (or equivalent service).
- [x] T010 [US2] Ensure real-time subscriptions correctly trigger UI updates when an NPC's visibility changes.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T011 [P] Manual verification of edge cases (Master refreshing page, player reconnecting).
- [x] T012 [P] Code cleanup and removing unused previous player list logic.
- [ ] T013 Run quickstart.md validation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 and US2 can theoretically proceed sequentially.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P1)**: Can start after Foundational (Phase 2). Depends on US1's list groupings for proper UI placement.

### Parallel Opportunities

- Migration and RLS tasks (T001, T002) can be batched in a single migration script.
- Store logic and frontend models (T003, T004) can be developed alongside the migration if mocking the DB.

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Database is ready.
2. Add User Story 1 → Test independently → The list is visually distinct.
3. Add User Story 2 → Test independently → The Master can hide/show NPCs.
