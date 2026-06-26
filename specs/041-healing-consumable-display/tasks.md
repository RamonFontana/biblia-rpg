---

description: "Task list for Healing Consumable Display implementation"
---

# Tasks: Healing Consumable Display

**Input**: Design documents from `/specs/041-healing-consumable-display/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No setup tasks required for this UI update)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*(No foundational tasks required)*

---

## Phase 3: User Story 1 - View Healing Details (Priority: P1) 🎯 MVP

**Goal**: As a player in an active session, I want to see the exact healing value (like "1d6" or "5 PV") on my consumable healing items, so that I know exactly how much health they will restore before using them.

**Independent Test**: Can be fully tested by looking at the player's inventory during an active session and verifying that a healing item displays its healing effect as a badge (e.g. `❤️ 1d6`).

### Implementation for User Story 1

- [x] T001 [US1] Update `src/components/inventory/InventoryList.tsx` to conditionally render a green badge with a heart icon (e.g., `❤️ 1d6` or `❤️ 5 PV`) if the item has `effects.heal_dice` or `effects.heal`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Players will see the exact healing value on the consumable items.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T002 Verify UI alignment and spacing in `InventoryList` on mobile and desktop breakpoints.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Stories (Phase 3+)**: Can start immediately as there are no setup or foundational tasks.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies.

### Within Each User Story

- T001 is a standalone task to implement the badge UI.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001).
2. **STOP and VALIDATE**: Test User Story 1 independently in the browser.
3. Complete Polish tasks (T002).

---

## Notes

- [Story] label maps task to specific user story for traceability
- Verify the badge design matches the project's existing aesthetic.
