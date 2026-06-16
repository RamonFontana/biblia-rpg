# Data Model: Online Players Session

No database schema changes are required for this feature. We rely on existing tables and Supabase Realtime channels.

## Existing Entities Utilized

### `game_sessions`
- `id` (uuid)
- `status` (text: 'active', 'paused', 'ended')

### `session_participants`
- `session_id` (uuid)
- `user_id` (uuid)
- `character_id` (uuid)

## Presence State (In-Memory)
- Channel: `session_[session_id]`
- Tracked Data:
  - `user_id`: UUID
  - `character_id`: UUID
  - `online_at`: ISO Timestamp
