# Implementation Plan: NPC Session Management

**Branch**: `016-npc-session` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-npc-session/spec.md`

## Summary

The feature adds NPC management for Game Masters during an active session. GMs can view NPC sheets, manage items, and insert campaign NPCs into the active session. The approach relies on an `is_npc` flag on the `characters` table to distinguish them and uses `session_participants` or `session_npcs` to link them to the active session.

## Technical Context

**Language/Version**: TypeScript, React 18+

**Primary Dependencies**: Supabase (Database + Realtime), TailwindCSS, React Router

**Storage**: Supabase PostgreSQL

**Testing**: React Testing Library / Vitest (or existing suite)

**Target Platform**: Web Browser

**Project Type**: Web Application

**Performance Goals**: Instant UI updates for inventory, real-time sync via Supabase.

**Constraints**: Must integrate with existing RPG Bíblico rule restrictions (e.g. no magic).

**Scale/Scope**: Dozens of NPCs per campaign.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica**: Passed. No magic items involved.
- **Materialismo Histórico**: Passed. Items managed are historical.
- **Sistema de Fé como Núcleo**: N/A for inventory UI, but stats must reflect Faith if applicable.
- **Tribos como Raças**: NPCs follow same character sheet rules if they are full characters.
- **A Regra de Levi**: N/A for this UI feature.
- **Documentação como Fonte de Verdade**: Spec generated and plan documented.

## Project Structure

### Documentation (this feature)

```text
specs/016-npc-session/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── session-management/
│   │   ├── components/
│   │   │   ├── SessionNPCList.tsx
│   │   │   ├── AddNPCModal.tsx
│   │   │   └── NPCInventoryManager.tsx
│   │   └── api/
│   │       ├── useSessionNPCs.ts
│   │       └── useUpdateNPCInventory.ts
├── pages/
│   └── session/
│       └── MasterSessionDashboard.tsx
supabase/
└── migrations/
    └── 20260616XXXXXX_update_characters_is_npc.sql
```

**Structure Decision**: A new feature module for session-management or extending existing session feature, plus a Supabase migration script to alter the `characters` table.

## Complexity Tracking

N/A - No violations.
