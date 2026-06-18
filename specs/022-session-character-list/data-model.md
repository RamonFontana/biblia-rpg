# Data Model: Session Character List Improvement

## `session_npcs` Table Updates

We are adding a new column to the existing `session_npcs` table.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `is_visible` | `boolean` | `false` | Indicates whether the NPC is visible to players in the session list. The Master can always see NPCs. |

## RLS (Row Level Security) Policies Update

We need to update or ensure that the RLS policies on `session_npcs` respect the `is_visible` flag.
- **Master**: Can `SELECT`, `UPDATE`, `DELETE`, `INSERT` any NPC in their session.
- **Player**: Can `SELECT` NPCs only where `session_id` matches their joined session AND `is_visible = true`.

## Participant / Character List Entry (Frontend)

In the frontend state, a unified interface or type should represent list entries to easily distinguish them:

```typescript
type SessionListRole = 'Master' | 'Player' | 'NPC';

interface SessionListEntry {
  id: string; // User ID or NPC ID
  characterName: string; // The character's name or NPC's name
  playerName: string; // The actual user's name (null for NPCs)
  role: SessionListRole;
  isVisible?: boolean; // For NPCs, determined by is_visible. For players, implicitly true.
}
```
