# Tasks: Session Master Tools & Faith Test Fixes

## Phase 1: Setup
- [x] T001 Create `src/components/session/DiceRollerDialog.tsx` boilerplate.

## Phase 2: Foundational
(No specific foundational tasks outside of the stories)

## Phase 3: User Story 1 (GM Tools and Faith Test)
- [x] T002 [US1] Implement `DiceRollerDialog.tsx` logic for d4, d6, d8, d10, d12, d20, d100 with private result display.
- [x] T003 [US1] Modify `src/components/session/PlayerTestDialog.tsx` to handle 1d6 penalty on Faith Test failure and update the database via Supabase client.
- [x] T004 [US1] Modify `src/components/session/SessionCharacterCard.tsx` (or equivalent character display component) to allow the GM to edit PV and Faith.
- [x] T005 [US1] Implement PV update rules in the GM edit component: Cap at `max_hp`, and set NPC status to "Morto" if PV reaches 0 (do not kill PCs).

## Phase 4: Polish & Integration
- [x] T006 Ensure components are properly integrated into the main Session UI so the GM can access them.
