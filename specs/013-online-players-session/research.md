# Research: Online Players Session

## 1. Supabase Presence

**Decision**: Use `supabase.channel('session_<id>').track(...)` for presence.

**Rationale**: Supabase provides built-in Presence on top of its Realtime channels. It automatically handles dropped connections by removing the user from the presence state.

**Alternatives considered**: Custom heartbeat via database table (rejected due to database write overhead and complexity in handling dropped connections).

## 2. Dashboard Active Session Query

**Decision**: Query `session_participants` joined with `game_sessions` where `status = 'active'` for the logged-in user.

**Rationale**: Allows fetching the exact sessions the player is currently participating in.
