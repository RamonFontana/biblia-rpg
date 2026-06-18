# Data Model: Enemy List

## Entities

### `characters` table updates
We already have a `characters` table. We need to ensure we can flag a character as an enemy.
- `is_enemy` (boolean, default false): Distinguishes an enemy from a regular player character or allied NPC.
- `session_id` (uuid, nullable): Links the enemy to a specific active session (if enemies are session-scoped).

### `items` (Existing)
Enemies will own items exactly like players do, linked via `character_id`.

## Validations
- Only the GM of the session can create, edit, or view characters where `is_enemy = true`.
- Players cannot query enemies via Supabase RLS (Row Level Security) if possible, or filtered out in the UI.
