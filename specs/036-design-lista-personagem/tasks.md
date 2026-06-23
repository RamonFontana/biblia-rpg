# Tasks: Character List Design Improvement

**Input**: Design documents from `/specs/036-design-lista-personagem/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify Tailwind configuration matches research.md themes (amber/stone palette) in `tailwind.config.js` or `src/index.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Identify or extract the character card component into `src/features/character-management/components/CharacterCard.tsx` if it's not already extracted

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Character List with Improved Visuals (Priority: P1) 🎯 MVP

**Goal**: Display characters with a visually appealing, themed Bronze/Iron Age design.

**Independent Test**: Can be fully tested by navigating to the character list page and observing the new layout, typography, colors, and thematic elements.

### Implementation for User Story 1

- [x] T003 [P] [US1] Update `src/features/character-management/components/CharacterCard.tsx` to use dark theme background classes (`bg-stone-900`, `text-stone-200`) and border styles (`border-amber-700/50`).
- [x] T004 [P] [US1] Update typography for Character Name, Tribe, and Class in `src/features/character-management/components/CharacterCard.tsx` for rustic/clean look.
- [x] T005 [P] [US1] Update attribute badges (PV, CA, Fé) to ensure high contrast against the dark card background in `src/features/character-management/components/CharacterCard.tsx`.
- [x] T006 [US1] Update `src/features/character-management/pages/CharacterList.tsx` background to dark theme (`bg-stone-950`).
- [x] T007 [US1] Style the "Novo Personagem" button with metallic/earthy tones (`bg-amber-700 text-amber-50`) in `src/features/character-management/pages/CharacterList.tsx` or a shared button component.
- [x] T008 [US1] Update Empty State UI in `src/features/character-management/pages/CharacterList.tsx` to match the premium theme.

**Checkpoint**: At this point, User Story 1 should be fully functional and visually aligned with the theme.

---

## Phase 4: User Story 2 - Interactive Visual Feedback (Priority: P2)

**Goal**: Provide clear interactive feedback when hovering or clicking on character cards and buttons.

**Independent Test**: Can be tested by interacting (hovering/clicking) with the character cards and the "Novo Personagem" button.

### Implementation for User Story 2

- [x] T009 [P] [US2] Add hover effects to `src/features/character-management/components/CharacterCard.tsx` (e.g., `hover:-translate-y-1`, `hover:border-amber-500`, `hover:shadow-amber-900/20`).
- [x] T010 [P] [US2] Add transition utilities (`transition-all duration-300 ease-in-out`) to `src/features/character-management/components/CharacterCard.tsx`.
- [x] T011 [US2] Add interactive hover/active states to the "Novo Personagem" button (e.g., `hover:bg-amber-600`).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Validate responsive design (mobile/desktop) for `src/features/character-management/pages/CharacterList.tsx` grid layout.
- [x] T013 Run `quickstart.md` validation.

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Should build upon US1 visually, but interactions can be tested independently.

### Within Each User Story

- Core visual structure before micro-animations.
- Story complete before moving to next priority

### Parallel Opportunities

- Updating typography and attribute badges within the `CharacterCard.tsx` can be done in parallel.
- Hover effects can be implemented simultaneously across cards and buttons.

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
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
