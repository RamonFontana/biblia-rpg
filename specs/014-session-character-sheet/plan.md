# Implementation Plan: Session Character Sheet

**Branch**: `014-session-character-sheet` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-session-character-sheet/spec.md`

## Summary

The goal is to improve the Active Session UI by allowing the Game Master (GM) to view the complete character sheet of any player, and allowing the Players to view their own complete character sheets without leaving the session screen. This will involve redesigning the online players list and creating a modal/slide-out component to show character stats (CA, PV, attributes, inventory, etc.).

## Technical Context

**Language/Version**: TypeScript, React 18+

**Primary Dependencies**: TailwindCSS, Supabase (for fetching character data), `lucide-react` (for icons), `shadcn/ui` (or similar components like Dialog/Sheet).

**Storage**: Supabase (PostgreSQL) - reading from the `characters` table.

**Testing**: N/A (Standard manual testing in browser)

**Target Platform**: Web Application (React SPA)

**Project Type**: Web Application

**Performance Goals**: N/A (Standard UI rendering)

**Constraints**: Must strictly follow the RPG Biblical constitution (e.g. no magic stats, Fé as the core stat, Bronze/Iron age items).

**Scale/Scope**: Active session screen updates.

## Constitution Check

*GATE: Passed.*

- **Fidelidade Bíblica / Materialismo Histórico**: The UI for the character sheet will display the "Fé" stat and standard attributes, respecting the Bronze/Iron age theme.
- **Sistema de Fé como Núcleo**: The "Fé" stat will be prominently displayed.

## Project Structure

### Documentation (this feature)

```text
specs/014-session-character-sheet/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (future)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── character/
│   │   └── CharacterSheetView.tsx
│   └── session/
│       ├── OnlinePlayersList.tsx
│       └── PlayerCard.tsx
└── pages/
    └── session/
        └── ActiveSessionPage.tsx
```

**Structure Decision**: We will add a new component `CharacterSheetView` in `src/components/character` and refactor the player listing in `ActiveSessionPage` and `OnlinePlayersList`.

## Complexity Tracking

No violations. The feature just adds UI for reading existing data.
