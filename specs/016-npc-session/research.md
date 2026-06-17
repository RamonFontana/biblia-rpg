# Research: NPC Session Management

## Decision: `characters` Table for NPCs
**Rationale**: By adding an `is_npc` boolean column to the existing `characters` table, we can reuse the entire character sheet UI, inventory system (`character_items`), and combat stats system.
**Alternatives considered**: Creating a new `campaign_npcs` table would require duplicating UI components and data fetching hooks for the character sheet.

## Decision: Realtime Sync for Inventory
**Rationale**: Using Supabase's Realtime subscriptions allows the Game Master's changes to an NPC's inventory to reflect immediately if the GM opens the sheet in multiple windows or if players are allowed to inspect NPCs (though mainly for GM).
**Alternatives considered**: Manual refetch on mutation, but Supabase provides easy realtime listeners.
