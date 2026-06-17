# Phase 1: Data Model

## JSONB `stats` Field Schema Update (Implicit)
- No actual SQL migration needed.
- `characters.stats` -> `pv` (integer), `max_pv` (integer), `faith` (integer), `status` (string).
- Updates will be handled directly through Supabase DB client in the React components.
