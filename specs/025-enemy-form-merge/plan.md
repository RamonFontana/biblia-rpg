# Implementation Plan: Merge Enemy Creation Forms

**Branch**: `024-enemy-list` | **Date**: 2026-06-18 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/025-enemy-form-merge/spec.md)

**Input**: Feature specification from `/specs/025-enemy-form-merge/spec.md`

## Summary

Unify the enemy creation interface to provide a single, robust form that works both during session creation and within an active session. The form will use `react-hook-form` and `zod` to handle dynamic skills (via `useFieldArray`), preset selection (Bestiário), image upload, and core attributes, omitting the concept of "Tribe" for enemies but keeping "Vocation".

## Technical Context

**Language/Version**: TypeScript / React 18
**Primary Dependencies**: `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `shadcn/ui`
**Storage**: Supabase (PostgreSQL) - JSONB `narrative` field or a new column for skills
**Testing**: N/A
**Target Platform**: Web (Vite)
**Project Type**: Web Application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica**: N/A (UI changes)
- **Materialismo Histórico**: N/A (UI changes)
- **Sistema de Fé**: N/A (UI changes)
- **Tribos como Raças**: Enemies do not strictly adhere to player tribes. The form reflects this by omitting the Tribe field but allowing custom Vocations.
- **Documentação como Fonte de Verdade**: Updates will follow the data-model document.

## Project Structure

### Documentation (this feature)

```text
specs/025-enemy-form-merge/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (future)
```

### Source Code

```text
src/
├── components/
│   └── session/
│       ├── enemy-form/
│       │   ├── UnifiedEnemyForm.tsx
│       │   ├── schema.ts
│       │   └── index.ts
│       ├── CreateEnemyDialog.tsx      # Will be updated to use UnifiedEnemyForm
│       └── SessionStepEnemies.tsx     # Will be updated to use UnifiedEnemyForm
└── features/
    └── character-creation/
        └── types/
            └── index.ts               # Updated to include `skills` in `DraftCharacter`
```

**Structure Decision**: Create a new `enemy-form` directory inside `src/components/session` to house the unified form component and its validation schema, keeping it modular and reusable in both `CreateEnemyDialog` and `SessionStepEnemies`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
