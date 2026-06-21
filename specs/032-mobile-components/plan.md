# Implementation Plan: Mobile Components Responsiveness

**Branch**: `032-mobile-components` | **Date**: 2026-06-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/032-mobile-components/spec.md`

## Summary

Ensure that all cards (NPC, Player) and other internal components within `ActiveSessionPage` remain within their container boundaries on small viewports (<640px) without causing horizontal scrolling or visual breakage.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: React, Tailwind CSS

**Storage**: N/A

**Testing**: Manual visual testing on mobile viewports

**Target Platform**: Mobile browsers / responsive web

**Project Type**: web-application

**Performance Goals**: N/A

**Constraints**: Use standard Tailwind CSS utilities for responsive design (e.g., flex-wrap, text-sm, truncating)

**Scale/Scope**: Frontend UI fixes on session components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Does not introduce magic or arcane items.
- [x] UI changes only, does not alter core game mechanics (Faith, Tribes).
- [x] Adheres to documentation as the source of truth.

## Project Structure

### Documentation (this feature)

```text
specs/032-mobile-components/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
└── components/
    ├── session/
    │   ├── SessionPlayerCard.tsx
    │   └── NPCList.tsx
    └── combat/
        └── CombatTracker.tsx
```

**Structure Decision**: This is a pure UI fix inside `src/components/session/` and `src/components/combat/`.

## Complexity Tracking

No additional complexity introduced. UI adjustments only.
