---

description: "Task list for NPC Playable Characters"
---

# Tasks: NPC Playable Characters

**Input**: Design documents from `/specs/012-npc-playable-characters/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create static presets file in src/data/npcPresets.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update SessionNPCDraft type and store in src/store/createSessionStore.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Create an NPC with a Character Sheet (Priority: P1) 🎯 MVP

**Goal**: Create an NPC that functions as a Playable Character (with a complete character sheet), so that they can accompany the players and participate in combat or skill checks.

**Independent Test**: Can be fully tested by selecting the "Full Character Sheet" option, filling out the required attributes, and verifying the data is saved correctly in the state and subsequently in the database.

### Implementation for User Story 2

- [x] T003 [P] [US2] Create NPCCharacterSheetModal component in src/components/session/CreateSessionForm/NPCCharacterSheetModal.tsx
- [x] T004 [US2] Update Step3NPCs to support modal opening and character data saving in src/components/session/CreateSessionForm/Step3NPCs.tsx
- [x] T005 [US2] Update session creation logic to save playable NPCs to Supabase in src/services/sessionService.ts

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Select NPC from Presets (Priority: P2)

**Goal**: Select from a list of pre-configured NPC presets (both simple and playable), so that the Master can quickly populate the session without having to build characters from scratch.

**Independent Test**: Can be fully tested by selecting a preset from a dropdown or list and verifying the form auto-fills with the preset's data.

### Implementation for User Story 3

- [x] T006 [US3] Add presets dropdown and autofill logic to src/components/session/CreateSessionForm/Step3NPCs.tsx

**Checkpoint**: At this point, User Stories 2 AND 3 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T007 Code cleanup and refactoring in src/components/session/CreateSessionForm/Step3NPCs.tsx
- [ ] T008 Verify UI responsiveness and accessibility of the new Modal

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Integrates with US2's form structure.

### Parallel Opportunities

- T001 can be executed in parallel with T002 since they touch completely different files.
- T003 can be built independently of T005.

## Implementation Strategy

### MVP First (User Story 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 2
4. **STOP and VALIDATE**: Test User Story 2 independently
5. Deploy/demo if ready
