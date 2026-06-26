# Implementation Plan: 040-ability-usage-system

**Branch**: `040-ability-usage-system` | **Date**: 2026-06-26 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/040-ability-usage-system/spec.md)

**Input**: Feature specification from `/specs/040-ability-usage-system/spec.md`

## Summary

The feature creates a comprehensive ability usage and recharge tracking system for characters. Abilities will have specific units of measurement for availability (e.g., per short rest, per combat, per day). The UI will display RPG details like roll dice and action type. Ability usage state and path choices (hybrid builds) will be persisted in the existing `skills` jsonb column of the `characters` table in Supabase. The documentation for all 13 tribes and 4 vocations will be strictly standardized in a tabular format as the ultimate source of truth.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: Zustand (state management, `combatStore`), Supabase (backend), TailwindCSS (styling), Lucide React (icons)

**Storage**: Supabase PostgreSQL (reusing `characters.skills` JSONB column)

**Testing**: Jest / React Testing Library (if configured)

**Target Platform**: Web Application

**Project Type**: Web Application (SPA)

**Performance Goals**: N/A

**Constraints**: Abilities can be used in and out of combat, except those explicitly marked "per combat". No mechanical effects (damage/healing) are applied automatically.

**Scale/Scope**: 17 markdown documentation files to standardize, updating `PlayerCombatView`, `SessionRestControls`, and the underlying data definitions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Fidelidade Bíblica (Sem Magia Arcana)**: PASS - Abilities reflect human skills or divine intervention via Faith. No arcane magic.
- **II. Materialismo Histórico**: PASS - Abilities do not introduce magic items.
- **III. Sistema de Fé como Núcleo**: PASS - Integrates with existing Faith system (e.g., Sacerdote uses Faith points).
- **IV. Tribos como Raças**: PASS - Fully implements the tracking of the documented tribe passives and abilities.
- **V. A Regra de Levi**: PASS - No conflict.
- **VI. Documentação como Fonte de Verdade**: PASS - This feature enforces standardization of `docs/tribos/*.md` and `docs/vocacoes/*.md` to match the Sacerdote template.

## Project Structure

### Documentation (this feature)

```text
specs/040-ability-usage-system/
├── plan.md              
├── research.md          
├── data-model.md        
└── quickstart.md        
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── combat/
│   │   └── PlayerCombatView.tsx
│   └── session/
│       └── SessionRestControls.tsx
├── data/
│   ├── abilities.ts (new or refactored from tribeSkills.ts)
│   └── tribeSkills.ts (to be refactored/deprecated)
└── types/
    └── character.ts (update skills jsonb typing)

docs/
├── tribos/ (13 files to standardize)
└── vocacoes/ (4 files to standardize)
```

**Structure Decision**: Single project React structure modifying the existing combat and session components, updating the central data definitions, and strictly standardizing the `docs/` folder.
