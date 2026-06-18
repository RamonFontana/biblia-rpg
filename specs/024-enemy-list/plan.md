# Implementation Plan: Enemy List

**Branch**: `024-enemy-list` | **Date**: 2026-06-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/024-enemy-list/spec.md`

## Summary

The GM needs a dedicated section to manage enemies during a session, including viewing full character sheets and managing enemy items without trade buttons. The list will be implemented directly in `ActiveSessionPage.tsx` where the placeholder "Controle de combate em breve..." resides. Additionally, when creating an enemy, the GM can define their attributes (which can be pre-filled but are editable) and optionally upload a base64 image.

## Technical Context

**Language/Version**: TypeScript, React
**Primary Dependencies**: Supabase (Backend/DB), React Router, TailwindCSS
**Storage**: PostgreSQL (Supabase) + local state management
**Testing**: N/A for now
**Target Platform**: Web Browser
**Project Type**: Web Application
**Performance Goals**: Standard UI responsiveness
**Constraints**: Only visible to GMs, no trade mechanics on enemy items
**Scale/Scope**: Dozens of enemies per session max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica**: Pass - No arcana magic introduced.
- **Materialismo Histórico**: Pass - Enemy items will follow existing constraints.
- **Sistema de Fé**: Pass - Enemies can have Faith mechanic just like players since they share the same sheet.
- **Tribos como Raças**: Pass - Enemies can use tribe passives if they have them.
- **A Regra de Levi**: Pass - N/A
- **Documentação**: Pass - Following Speckit.

## Project Structure

### Documentation (this feature)

```text
specs/024-enemy-list/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── session/
│   │   ├── SessionEnemyList.tsx    # New: Replaces the placeholder
│   │   ├── CreateEnemyDialog.tsx   # New: Form to create enemy with attributes/image
│   │   └── EnemyItemManager.tsx    # New: Simplified item manager for enemies
├── hooks/
│   └── useSessionEnemies.ts        # New: Fetches enemies for the session
└── pages/
    └── session/
        └── ActiveSessionPage.tsx   # Modified: integrate SessionEnemyList
```

**Structure Decision**: A new `SessionEnemyList` component will be created and injected into `ActiveSessionPage.tsx`. We will create a `useSessionEnemies` hook to fetch characters marked as `is_enemy: true` for the session.

## Complexity Tracking

None needed.
