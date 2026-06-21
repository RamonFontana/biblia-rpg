# Tasks: Mobile Components Responsiveness

**Input**: Design documents from `/specs/032-mobile-components/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup & Foundational

**Purpose**: Pure UI fixes using Tailwind CSS. No backend setup or foundational infrastructure changes are required.

- [ ] T001 Verify Tailwind configuration is working properly for responsive prefixes (`sm:`, `md:`).

---

## Phase 2: User Story 1 - Fix NPC Card Responsiveness (Priority: P1) 🎯 MVP

**Goal**: Ensure NPC cards fit horizontally on mobile screens (<640px) without content breaking or overflowing.

**Independent Test**: Open session view on a 320px viewport and verify the HP/CA/Faith controls inside NPC cards do not overflow.

### Implementation for User Story 1

- [ ] T002 [P] [US1] Fix layout overflow in `src/components/session/NPCList.tsx` or its child NPC card component by applying `flex-wrap` and min-width utilities to the control buttons group.
- [ ] T003 [P] [US1] Apply text truncation (`truncate`, `min-w-0`) to long NPC names in the card headers in `src/components/session/NPCList.tsx`.

**Checkpoint**: At this point, User Story 1 should be fully functional.

---

## Phase 3: User Story 2 - Fix Player Card Responsiveness (Priority: P2)

**Goal**: Ensure player character cards are responsive and do not break horizontally on small screens.

**Independent Test**: Verify player cards in the session view on a 320px viewport.

### Implementation for User Story 2

- [x] T004: Fix layout overflow in `src/components/session/SessionParticipantList.tsx`
- [x] Modify `SessionParticipantList.tsx` and the underlying player/NPC cards (like `PlayerCard.tsx`) to support `flex-wrap` and text truncation.
- [x] Ensure the online status dots/badges stay aligned with the avatar/name without breaking the layout.

- [x] T005: Add text truncation to long character names
- [x] Ensure names and class strings truncate properly using `truncate` and `min-w-0` on their parents.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 4: User Story 3 - Audit and Fix Remaining Components (Priority: P3)

**Goal**: Ensure all other session components (Combat Tracker, History Log) are responsive.

**Independent Test**: Start combat on mobile and verify the tracker layout. View history logs to ensure long entries wrap.

### Implementation for User Story 3

- [x] T006: Verify and fix layout overflow in `src/components/combat/CombatDashboard.tsx` or similar
- [x] Check any cards rendered during combat within the active session screen and apply `flex-wrap` where multiple stats or actions are inline.

- [x] T007: Validate other inline dialogs or panels
- [x] Ensure that any other side panel or modal content shown inside `ActiveSessionPage` is scrollable and won't exceed screen width.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validations and cleanups.

- [ ] T008 Run quickstart.md validation to ensure everything is responsive.
- [ ] T009 Check for horizontal overflow (`overflow-x-hidden`) on the body level in `src/pages/session/ActiveSessionPage.tsx` as a fallback.

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (P1)**: Can start immediately.
- **US2 (P2)**: Can start immediately (parallel with US1 as it touches different files).
- **US3 (P3)**: Can start immediately.

### Parallel Opportunities

- T002 and T004 can be executed in parallel since they affect different UI components.
- T006 can also run in parallel.
