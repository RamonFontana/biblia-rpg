# Tasks: NPC Session Management

**Input**: Design documents from `/specs/016-npc-session/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create migration for `characters` table to add `is_npc` column in `supabase/migrations/20260616999999_update_characters_is_npc.sql`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 Execute Supabase migration to apply `is_npc` to the database
- [x] T003 Update `Character` type definition in frontend to include `is_npc?: boolean` (in `src/types/character.ts` or appropriate file)

## Phase 3: User Story 1 - Master Views Session NPCs (Priority: P1)

**Goal**: See a list of all NPCs present in the current session

- [x] T004 [US1] Create API hook `useSessionNPCs.ts` in `src/features/character-management/api/` to fetch characters with `is_npc = true` that are in the active session
- [x] T005 [US1] Create UI component `SessionNPCList.tsx` in `src/components/session/` to display the list of NPCs
- [x] T006 [US1] Integrate `SessionNPCList` into `MasterSessionDashboard` or `ActiveSession/index.tsx`

## Phase 4: User Story 2 - Master Inspects NPC Sheet (Priority: P1)

**Goal**: Click on any NPC in the session list to open their complete character sheet

- [x] T007 [US2] Update `SessionNPCList.tsx` to handle clicking on an NPC card
- [x] T008 [US2] Implement or reuse character sheet modal/panel to display the selected NPC's data (attributes, items)

## Phase 5: User Story 3 - Master Manages NPC Items in Session (Priority: P2)

**Goal**: Manage (add/remove) and use the NPC's items

- [x] T009 [US3] Create API hook `useUpdateNPCInventory.ts` for adding/removing items from `character_items`
- [x] T010 [US3] Implement `NPCInventoryManager.tsx` UI component to handle inventory modifications
- [x] T011 [US3] Integrate `NPCInventoryManager` into the NPC character sheet view

## Phase 6: User Story 4 - Master Adds NPCs to Session (Priority: P2)

**Goal**: Insert existing NPCs from campaign into the active session roster

- [x] T012 [US4] Create API hook to fetch all campaign NPCs (`is_npc = true`)
- [x] T013 [US4] Create `AddNPCModal.tsx` component to allow Master to select an NPC and add them to `session_participants`
- [x] T014 [US4] Add "Add NPC" button in session view to open `AddNPCModal`

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T015 Verify Realtime sync for inventory and session participants
- [x] T016 Run quickstart.md validation locally
