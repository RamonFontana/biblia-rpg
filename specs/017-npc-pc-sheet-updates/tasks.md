# Tasks: NPC and PC Session Sheet Enhancements

**Input**: Design documents from `/specs/017-npc-pc-sheet-updates/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create `src/data/tribeSkills.ts` to hold static tribal skills mapping.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Setup database migration to add `effects` JSONB column to `items` table.
- [x] T003 Update `CharacterStats` interface in `src/features/character-creation/types/index.ts` to explicitly type `current_pv` and `current_faith`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Master Views Complete NPC Stats (Priority: P1) 🎯 MVP

**Goal**: Master can see HP, CA, and Faith of NPCs in the session view.

**Independent Test**: Master opens the session view and sees the actual stats instead of just name and vocation.

### Implementation for User Story 1

- [x] T004 [US1] Update `src/hooks/useSessionNPCs.ts` to properly map the `stats` field for non-playable NPCs.
- [x] T005 [US1] Update `src/components/session/SessionNPCList.tsx` to allow clicking and opening `CharacterSheetView` for all NPCs, or display HP, CA, and Faith inline in the list.

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Applying Consumable Effects (Priority: P1)

**Goal**: Players and Masters can use consumable items from the inventory, automatically updating HP or applying effects.

**Independent Test**: Use a healing consumable; observe HP increase and item quantity decrease.

### Implementation for User Story 2

- [x] T006 [P] [US2] Create or update `useConsumableItem` function in `src/hooks/useUpdateNPCInventory.ts` or a new hook to handle parsing `effects` JSON and updating character stats.
- [x] T007 [US2] Update inventory UI in `src/components/character/CharacterSheetView.tsx` to display a "Use" button for consumables and trigger the effect function.
- [x] T008 [US2] Update `use_consumable_item` RPC in Supabase (if we choose backend handling instead of frontend, but research said frontend). Alternatively, rely entirely on the frontend function to `update` stats and `decrement` item.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Displaying Racial Skills, Modifiers, and Proficiency (Priority: P2)

**Goal**: Attribute modifiers, proficiency bonus, and racial skills are visible on character/NPC sheets.

**Independent Test**: Open a character sheet and verify math for modifiers, +2 proficiency, and presence of racial skills.

### Implementation for User Story 3

- [x] T009 [P] [US3] Create utility functions to calculate modifiers and proficiency based on attributes and level.
- [x] T010 [US3] Update `src/components/character/CharacterSheetView.tsx` to display attribute modifiers instead of just raw values.
- [x] T011 [US3] Update `src/components/character/CharacterSheetView.tsx` to display the proficiency bonus in the header or stats section.
- [x] T012 [US3] Update `src/components/character/CharacterSheetView.tsx` to read from `src/data/tribeSkills.ts` and display the character's racial passives based on their tribe.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T013 Code cleanup and ensure type safety for the new `effects` object in items.
- [x] T014 Run quickstart.md validation (run `supabase db push` to verify migration applies smoothly).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel.
- **Polish (Final Phase)**: Depends on all desired user stories being complete
