# Implementation Plan: Session Character List Improvement

**Branch**: `022-session-character-list` | **Date**: 2026-06-17 | **Spec**: [specs/022-session-character-list/spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/022-session-character-list/spec.md)

**Input**: Feature specification from `/specs/022-session-character-list/spec.md`

## Summary

The session character list will be reorganized to clearly separate the Master, Player Characters, and NPCs. Character cards will display the Character Name as the main title and the Player Name as a subtitle. A new `is_visible` flag will be added to the Supabase `session_npcs` table, allowing the Master to toggle NPC visibility for the players.

## Technical Context

**Language/Version**: TypeScript / React 19 / Vite 8

**Primary Dependencies**: React Router DOM, Zustand, Supabase, Tailwind, Radix UI

**Storage**: Supabase PostgreSQL

**Testing**: Vitest

**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: web-app

**Constraints**: Real-time updates for connected players via Supabase subscriptions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I-V**: No violations. The changes are strictly UI/UX organization and do not alter the rules of the game, faith system, tribes, or classes.
- **Principle VI**: The change is UI/structural and does not invent new RPG rules.

## Project Structure

### Documentation (this feature)

```text
specs/022-session-character-list/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── components/
│   └── session/
│       ├── ActiveSessionPage.tsx
│       ├── SessionParticipantList.tsx
│       └── SessionCharacterCard.tsx
├── store/
│   └── useSessionStore.ts
└── lib/
    └── supabase/
```

**Structure Decision**: The project is a standard React web application under `src/`. The session components are likely located in `src/components/session/` or `src/pages/session/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
