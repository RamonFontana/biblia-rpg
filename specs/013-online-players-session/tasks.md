# Tasks: Online Players Session

**Input**: Design documents from `/specs/013-online-players-session/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create empty component `src/components/session/OnlinePlayersList.tsx`
- [x] T002 [P] Create empty hook `src/hooks/useSupabasePresence.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement Supabase Presence hook in `src/hooks/useSupabasePresence.ts` handling join/leave and returning the list of online users

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Join Active Session (Priority: P1) 🎯 MVP

**Goal**: Players see a button to join an active session my character is part of right after I log in, so I can easily enter the game.

**Independent Test**: Can be fully tested by logging in as a user with a character in an active session and seeing the "Join Session" button.

### Implementation for User Story 1

- [x] T004 [P] [US1] Create hook `src/hooks/useActiveSession.ts` to query `game_sessions` and `session_participants` for the user's active sessions
- [x] T005 [US1] Update `src/App.tsx` (Home component) to use the hook and display the "Join Session" buttons/list for active sessions
- [x] T006 [US1] Add empty state handling for when the user has no active sessions

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - View Online Players (Master View) (Priority: P1)

**Goal**: Game Master sees a list of online players in the active session to know who is currently connected.

**Independent Test**: Can be fully tested by having a master start a session and having a player join it; the master should see the player's status update to online.

### Implementation for User Story 2

- [x] T007 [P] [US2] Implement `src/components/session/OnlinePlayersList.tsx` to render the list of players utilizing `useSupabasePresence.ts`
- [x] T008 [US2] Integrate `OnlinePlayersList` into `src/pages/session/ActiveSessionPage.tsx`
- [x] T009 [US2] Automatically mark the player as offline utilizing the timeout from Supabase Presence

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 [P] Run `npm run lint` and verify types
- [x] T011 Run quickstart.md validation to ensure the entire flow works from start to finish

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- Setup tasks T001 and T002 can be executed in parallel.
- US1 T004 and US2 T007 can be executed in parallel once Foundational Phase is done.

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
