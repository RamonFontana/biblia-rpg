# Research: Session Character List Improvement

## Database Readiness

**Decision**: Add a new `is_visible` boolean column to the `session_npcs` table in Supabase, defaulting to `false`.
**Rationale**: The database currently has a `session_npcs` table which tracks `id`, `session_id`, `name`, `description`, `stats`, and `created_at`. It lacks a visibility status field. We need an `is_visible` boolean with a default of `false` to support the Master's control over NPC visibility to players.
**Alternatives considered**: Storing visibility in the `stats` JSONB field. Rejected because visibility is a core property that we may want to filter on using Row Level Security (RLS) or direct queries. A dedicated column is more robust and secure.

## Technology Stack

**Decision**: TypeScript / React 19 / Vite 8, Supabase, Tailwind CSS, Radix UI.
**Rationale**: These are the established technologies of the project as discovered in previous feature plans.
**Alternatives considered**: N/A, adhering to project standards.
