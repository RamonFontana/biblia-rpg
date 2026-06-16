# Implementation Plan: Online Players Session

**Branch**: `013-online-players-session` | **Date**: 2026-06-16 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/013-online-players-session/spec.md)

**Input**: Feature specification from `/specs/013-online-players-session/spec.md`

## Summary

Implement real-time online player tracking using Supabase Presence in the `ActiveSessionPage`, and provide players with a "Join Session" button on their dashboard to quickly join ongoing sessions they are part of.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: Supabase JS Client, React Router

**Storage**: Supabase PostgreSQL

**Testing**: React Testing Library / Vitest

**Target Platform**: Web Browser

**Project Type**: Web Application

**Performance Goals**: Real-time presence updates under 2 seconds.

**Constraints**: Must use Supabase Realtime Presence.

**Scale/Scope**: Session sizes up to ~10-15 players.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Documentação como Fonte de Verdade**: Spec generated and plan documented.

## Project Structure

### Documentation (this feature)

```text
specs/013-online-players-session/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── session/
│   │   └── ActiveSessionPage.tsx
│   └── dashboard/
│       └── PlayerDashboard.tsx
├── components/
│   └── session/
│       └── OnlinePlayersList.tsx
└── hooks/
    └── useSupabasePresence.ts
```

**Structure Decision**: Add hooks for Supabase Presence and components to show online players in the active session page. Update the player dashboard to show active sessions.
