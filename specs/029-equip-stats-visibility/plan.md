# Implementation Plan: Equip Stats Visibility

**Branch**: `[029-equip-stats-visibility]` | **Date**: 2026-06-19 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/029-equip-stats-visibility/spec.md)

**Input**: Feature specification from `/specs/029-equip-stats-visibility/spec.md`

## Summary

Extract total AC calculation to a shared utility and use it across session views (PlayerCard, SessionEnemyList, SessionNPCList) so that equipment AC bonuses are correctly reflected dynamically. Update `EquipmentSlots.tsx` to display weapon damage dice and armor AC bonuses.

## Technical Context

**Language/Version**: TypeScript / React (Vite)

**Primary Dependencies**: React, Supabase, Tailwind CSS, lucide-react

**Storage**: Supabase PostgreSQL (`characters`, `character_items`)

**Testing**: N/A

**Target Platform**: Web application

**Project Type**: web-app

**Performance Goals**: Fast UI reactivity when equipping/unequipping items

**Constraints**: AC must be dynamically calculated on the client to avoid redundant database writes

**Scale/Scope**: Impacts combat and session management UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (Materialismo Histórico)**: Ensure AC bonuses come exclusively from equipped mundane armor (no magical stats).
- **Compliance**: The changes only involve UI rendering of already existing system variables without introducing arcane magic.

## Project Structure

### Documentation (this feature)

```text
specs/029-equip-stats-visibility/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── equipmentUtils.ts
├── components/
│   ├── combat/
│   ├── inventory/
│   │   └── EquipmentSlots.tsx
│   └── session/
│       ├── PlayerCard.tsx
│       ├── SessionEnemyList.tsx
│       └── SessionNPCList.tsx
```

**Structure Decision**: Using the existing Web application (React) structure in `src/`. No new folders needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A
