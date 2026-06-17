# Implementation Plan: NPC and PC Session Sheet Enhancements

**Branch**: `017-npc-pc-sheet-updates` | **Date**: 2026-06-16 | **Spec**: [spec.md](../spec.md)

**Input**: Feature specification from `/specs/017-npc-pc-sheet-updates/spec.md`

## Summary

This feature will enhance the NPC and PC session sheets by making sure HP, AC (CA), and Faith are visible for all NPCs, adding functional consumable item usage with stat-affecting effects (like healing), and displaying attribute modifiers, proficiency, and racial skills correctly.

## Technical Context

**Language/Version**: TypeScript / React / Next.js

**Primary Dependencies**: Supabase (PostgreSQL), Tailwind CSS, Lucide React

**Storage**: Supabase PostgreSQL (`items`, `characters`, `session_npcs` tables)

**Testing**: Manual UI testing and DB verification

**Target Platform**: Web application

**Project Type**: Web service / RPG Manager

**Performance Goals**: N/A (Standard UI updates)

**Constraints**: Respect the "No magic" and "Tribes as Races" constitution rules.

**Scale/Scope**: Session view, Character Sheet view, Database migrations for items.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I & II**: Item effects will not be magical, but practical (e.g. bandages, herbs for healing). No arcana.
- **Principle IV**: The racial skills are being implemented respecting the 12 Tribes.

## Project Structure

### Documentation (this feature)

```text
specs/017-npc-pc-sheet-updates/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── character/
│   │   ├── CharacterSheetView.tsx
│   │   └── NPCInventoryManager.tsx
│   └── session/
│       └── SessionNPCList.tsx
├── features/
│   └── character-creation/
│       └── types/index.ts
├── hooks/
│   ├── useSessionNPCs.ts
│   └── useUpdateNPCInventory.ts
└── data/
    └── tribeSkills.ts (NEW)

supabase/
└── migrations/
    └── 20260617XXXXXX_add_item_effects.sql (NEW)
```

**Structure Decision**: Standard React component and Supabase structure is used. We are introducing a static data file for `tribeSkills.ts` to hold the racial capabilities.

