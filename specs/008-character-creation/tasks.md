# Tasks: Character Creation

**Input**: Design documents from `/specs/008-character-creation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the character creation feature

- [ ] T001 Create feature directory structure in `src/features/character-creation/` (components, schemas, store, types)
- [ ] T002 Install required dependencies if not present: `zod`, `react-hook-form`, `@hookform/resolvers`, `zustand`, `lucide-react`
- [ ] T003 Create `src/features/character-creation/types/index.ts` with basic interfaces based on `data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define Zod schemas for all wizard steps and final payload in `src/features/character-creation/schemas/characterSchema.ts`
- [ ] T005 Implement the Zustand store in `src/features/character-creation/store/useCharacterCreationStore.ts` with default empty state and basic navigation actions
- [ ] T006 Create the base `WizardLayout` component in `src/features/character-creation/components/WizardLayout.tsx` handling step navigation
- [ ] T007 Create the main page wrapper `src/pages/CharacterCreationPage.tsx` and integrate `WizardLayout`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Select Tribe and Vocation (Priority: P1) 🎯 MVP

**Goal**: Users select their character's tribe and vocation, viewing descriptions and abilities.

**Independent Test**: Can be tested by navigating the first two steps of the wizard and observing state changes in the Zustand store.

### Implementation for User Story 1

- [ ] T008 [US1] Create `TribeSelection` component using React Hook Form in `src/features/character-creation/components/steps/TribeSelection.tsx`
- [ ] T009 [US1] Create `VocationSelection` component using React Hook Form in `src/features/character-creation/components/steps/VocationSelection.tsx`
- [ ] T010 [US1] Implement Tribe and Vocation rules (including the Levite rule) in the store actions
- [ ] T011 [US1] Integrate `TribeSelection` and `VocationSelection` into `WizardLayout.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Generate and Assign Attributes (Priority: P1)

**Goal**: Users choose attribute generation method (Array or Dice) and assign them.

**Independent Test**: Verify attribute values are correctly generated based on the selected method and saved to the store.

### Implementation for User Story 2

- [ ] T012 [US2] Create `AttributeGeneration` component in `src/features/character-creation/components/steps/AttributeGeneration.tsx`
- [ ] T013 [US2] Implement Dice rolling logic and Standard Array assignment logic within the component
- [ ] T014 [US2] Integrate `AttributeGeneration` step into `WizardLayout.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Select Fortress and Temptation (Priority: P1)

**Goal**: Define 1 Fortress (virtue) and 1 Temptation (flaw) from a list.

**Independent Test**: Verify only one of each can be selected and descriptions render correctly.

### Implementation for User Story 3

- [ ] T015 [US3] Create `FaithAspects` component in `src/features/character-creation/components/steps/FaithAspects.tsx`
- [ ] T016 [US3] Add validation ensuring exactly one Fortress and one Temptation is selected
- [ ] T017 [US3] Integrate `FaithAspects` step into `WizardLayout.tsx`

**Checkpoint**: Faith system selections are functional.

---

## Phase 6: User Story 4 - Initial Calculations (Priority: P2)

**Goal**: View automatically calculated initial stats: PV, CA, and Faith Points.

**Independent Test**: Verify stats reflect the previous choices of tribe, vocation, and attributes.

### Implementation for User Story 4

- [ ] T018 [US4] Create `InitialStats` component in `src/features/character-creation/components/steps/InitialStats.tsx`
- [ ] T019 [US4] Implement derivation logic in the Zustand store (or local component) to calculate PV, CA, and Faith Points
- [ ] T020 [US4] Integrate `InitialStats` step into `WizardLayout.tsx`

---

## Phase 7: User Story 5 - Initial Equipment Merchant (Priority: P1)

**Goal**: Purchase starting equipment from a gamified "merchant" interface using initial coins.

**Independent Test**: Ensure wallet deducts correctly and packages show correct item tooltips.

### Implementation for User Story 5

- [ ] T021 [US5] Create `EquipmentMerchant` component in `src/features/character-creation/components/steps/EquipmentMerchant.tsx`
- [ ] T022 [US5] Implement coin deduction logic and package expansion UI
- [ ] T023 [US5] Integrate `EquipmentMerchant` step into `WizardLayout.tsx`

---

## Phase 8: User Story 6 - Character Details, Summary and Save (Priority: P1)

**Goal**: Enter narrative details, review summary, and save to Supabase.

**Independent Test**: Finalize character and confirm it appears in Supabase.

### Implementation for User Story 6

- [ ] T024 [US6] Create `NarrativeDetails` component in `src/features/character-creation/components/steps/NarrativeDetails.tsx`
- [ ] T025 [US6] Create `Summary` component in `src/features/character-creation/components/steps/Summary.tsx`
- [ ] T026 [US6] Implement Supabase save function interacting with the `characters` table upon confirmation
- [ ] T027 [US6] Integrate `NarrativeDetails` and `Summary` steps into `WizardLayout.tsx`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect the application integration.

- [ ] T028 Update App routing (e.g., `src/App.tsx` or router config) to map `/create-character` to `CharacterCreationPage.tsx`
- [ ] T029 Add navigation buttons in `Home` screen leading to the character creation flow
- [ ] T030 Final code cleanup and styling polish (TailwindCSS refinements) across all wizard steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: Depend on Foundational phase completion. Due to the nature of a multi-step wizard, they are best implemented sequentially (US1 → US6) since each step builds upon the state of the previous one.
- **Polish (Phase 9)**: Depends on all user stories being complete.

### Parallel Opportunities

- Zod schemas (T004) and Zustand store structure (T005) can be defined in parallel by looking at the data model.
- Independent step components UI can be built in parallel if mock data is used before wiring into the Zustand store.

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Base Wizard navigation works with blank steps.
2. Add US1 → Test Tribe/Vocation selection.
3. Add US2 → Test Attribute logic.
4. Add US3, US4 → Test Faith and Calculated Stats.
5. Add US5 → Test Merchant logic.
6. Add US6 → Complete the flow and verify Supabase save.
7. Connect to App Routing (Phase 9) and deploy.
