# Data Model: NPC Session Management

## Entities

### `characters`
- **Fields**: Added `is_npc` (boolean, default false).
- **Relationships**: A user can own multiple characters (some PC, some NPC).

### `session_npcs` or `session_participants`
- **Fields**: If using `session_participants`, ensure it can reference a `character_id` where `characters.is_npc = true`.
- **Relationships**: Links `game_sessions` and `characters`.

### `character_items`
- **Fields**: `id`, `character_id`, `item_id`, `quantity`
- **Relationships**: Same as before, but now supports NPC inventory out of the box because NPCs are `characters`.

## Validations
- `is_npc` cannot be null.
- Game Master has full RLS access to update `character_items` for NPCs in their session.
