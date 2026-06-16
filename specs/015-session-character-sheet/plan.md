# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

This feature implements the display of categorized items on the character sheet, the expansion of "kits" into individual items, and a token context menu for players during a session. It also adds the ability to use consumable items, decreasing their quantity and syncing the state in real-time. To support this, we will introduce `items`, `kit_items`, and `character_items` tables in Supabase, along with Postgres RPCs for atomic operations.

## Technical Context

**Language/Version**: React 18, TypeScript, Vite

**Primary Dependencies**: React Router, TailwindCSS, Supabase JS Client, Lucide React

**Storage**: Supabase (PostgreSQL)

**Testing**: Vitest (if configured), Manual Testing

**Target Platform**: Web (Modern Browsers)

**Project Type**: Web Application

**Performance Goals**: < 500ms to render inventory, < 200ms to open context menu, < 1s to sync data via real-time subscriptions

**Constraints**: Must use Supabase RPCs for kit expansion and consumable usage to prevent race conditions.

**Scale/Scope**: RPG game sessions (typically 5-10 participants)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I (Sem Magia Arcana)**: OK. Nenhum item mágico está sendo adicionado. Consumíveis podem ser curativos naturais ou utilitários.
- **Princípio II (Materialismo Histórico)**: OK. Os itens modelados serão mundanos (espadas de bronze, ferramentas, etc.).
- **Princípio VI (Documentação)**: OK. A mecânica de itens está sendo especificada na `spec.md` e `data-model.md`.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
### Source Code (repository root)

```text
src/
├── components/
│   ├── session/
│   │   ├── CharacterSheet.tsx       # To be updated with item categories
│   │   ├── TokenContextMenu.tsx     # NEW: Floating menu for token clicks
│   │   └── Token.tsx                # To be updated to handle clicks and trigger the menu
├── types/
│   └── supabase.ts                  # To be updated with new tables
└── lib/
    └── supabase.ts                  # Using supabase client for RPC calls

supabase/
└── migrations/
    └── [timestamp]_create_inventory_tables.sql  # NEW: Migration for items, kit_items, character_items, and RPCs
```

**Structure Decision**: The feature integrates into the existing `src/components/session` directory for UI components and `supabase/migrations` for the database schema.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
