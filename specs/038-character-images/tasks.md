# Tasks: Character Images

**Input**: Design documents from `/specs/038-character-images/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No setup required as this is an UI-only feature that builds upon an existing project structure and database).*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create `CharacterAvatar` shared component in `src/components/ui/CharacterAvatar.tsx` to handle image rendering and initials fallback.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 3 - Missing Image Fallback (Priority: P2)

**Goal**: Display an initials-based fallback placeholder for characters without custom images or when images fail to load.
*(Note: This is prioritized to be fully implemented inside the CharacterAvatar component before rolling it out to other views).*

**Independent Test**: Mount the `CharacterAvatar` component in isolation or test it in one view passing an empty `imageUrl`.

### Implementation for User Story 3

- [x] T002 [US3] Implement initials extraction logic and solid background rendering in `src/components/ui/CharacterAvatar.tsx`.
- [x] T003 [US3] Add `onError` handler to the `<img>` tag in `src/components/ui/CharacterAvatar.tsx` to switch to fallback mode on load failure.

**Checkpoint**: Fallback logic is fully functional in the base component.

---

## Phase 4: User Story 1 - View Character Image on Sheet (Priority: P1)

**Goal**: Users see customized images on the detailed character sheet.

**Independent Test**: Open a character sheet for a character and verify the custom image (or fallback) loads correctly.

### Implementation for User Story 1

- [x] T004 [P] [US1] Integrate `CharacterAvatar` into `src/components/character/CharacterSheetView.tsx` replacing the current header visual space.

**Checkpoint**: At this point, User Story 1 should be fully functional.

---

## Phase 5: User Story 2 - View Character Image on Cards (Priority: P1)

**Goal**: Users see character images on compact character cards/lists for quick identification.

**Independent Test**: View lists of characters in the session overview and the combat tracker.

### Implementation for User Story 2

- [x] T005 [P] [US2] Integrate `CharacterAvatar` into `src/components/combat/PlayerCombatView.tsx`.
- [x] T006 [P] [US2] Integrate `CharacterAvatar` into lists in `src/components/session/SessionParticipantList.tsx`.
- [x] T007 [P] [US2] Integrate `CharacterAvatar` into `src/components/session/SessionEnemyList.tsx`.
- [x] T008 [P] [US2] Integrate `CharacterAvatar` into `src/components/session/SessionNPCList.tsx`.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T009 Polish responsive sizing of `CharacterAvatar` across mobile and desktop views.
- [x] T010 Verify UI spacing/alignment in all updated components using `npm run dev`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A
- **Foundational (Phase 2)**: Starts immediately.
- **User Stories (Phase 3-5)**: Depend on the `CharacterAvatar` component (Phase 2).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- Once `CharacterAvatar` is built (T001-T003), integration into `CharacterSheetView` (T004) and the various card/list views (T005-T008) can all be done in parallel since they touch different files.

---

## Implementation Strategy

### Incremental Delivery

1. Complete Foundational UI component (`CharacterAvatar`).
2. Implement fallback logic (US3).
3. Rollout to Character Sheets (US1).
4. Rollout to Cards and Lists (US2).
5. Polish and verify responsiveness.
