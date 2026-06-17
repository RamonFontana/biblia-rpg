# Implementation Plan: Session Player Tests

**Branch**: `018-session-player-tests` | **Date**: 2026-06-17 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/018-session-player-tests/spec.md)

**Input**: Feature specification from `/specs/018-session-player-tests/spec.md`

## Summary

Implement a real-time player testing feature in the game session. The Master initiates a test (type, difficulty, target players) via a dialog triggered by a button above the character cards. Selected players receive a blocking dialog to input their physical dice roll results. The Master's dialog acts as a real-time dashboard tracking responses and calculating pass/fail (>= difficulty). Other players see a "busy" status for those taking the test. Supabase Realtime and database tables will be used to persist and sync this state.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: React, Supabase, Tailwind CSS, Radix UI (or similar for dialogs)

**Storage**: Supabase PostgreSQL (`session_tests`, `session_test_results` tables)

**Target Platform**: Web Application

**Project Type**: Web Application

**Performance Goals**: Real-time sync (< 200ms latency for test requests and answers)

**Constraints**: Requires active internet connection for Realtime WebSockets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica & Materialismo Histórico**: The test types (Perception, Faith) are aligned with the RPG rules. No magical automation is introduced; players roll physical dice and input values.
- **Sistema de Fé**: Faith tests are supported as an option.
- **Documentação**: The rules applied (e.g., success is result >= difficulty) are aligned with standard d20 mechanics as clarified.

No violations found.

## Project Structure

### Documentation (this feature)

```text
specs/018-session-player-tests/
├── plan.md
├── research.md
├── data-model.md
└── spec.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── session/
│   │   ├── MasterTestDialog.tsx     # Master's initiator and dashboard modal
│   │   ├── PlayerTestDialog.tsx     # Player's input modal
│   │   └── CharacterCard.tsx        # Update to show 'busy' status
├── hooks/
│   ├── useSessionTests.ts           # Hook for real-time test state and actions
├── services/
│   ├── sessionTestService.ts        # Supabase DB operations for tests
supabase/
└── migrations/
    └── 20260617000000_create_session_tests.sql
```

**Structure Decision**: The logic will be encapsulated in a new hook `useSessionTests` and UI components will be added to the `src/components/session` directory. A database migration will be created for the new tables.

## Execution Plan (Phase 2 & beyond)

1. **Database Migration**: Create `session_tests` and `session_test_results` tables.
2. **Data Layer**: Implement `sessionTestService.ts` and `useSessionTests.ts` hook for fetching and subscribing to Realtime changes.
3. **Master UI**: Add the trigger button in the session view. Create the `MasterTestDialog` to configure the test and view live results.
4. **Player UI**: Create the `PlayerTestDialog` that automatically opens when a pending test is detected.
5. **Session UI**: Update character cards to show a "busy/testing" indicator when a player has a pending test.
