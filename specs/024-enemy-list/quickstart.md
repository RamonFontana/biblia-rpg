# Quickstart: Enemy List

To start implementing this feature:

1. Update the Supabase `characters` table to include an `is_enemy` boolean column if it doesn't exist, or use `is_npc = true` along with a new `npc_type = 'enemy'` enum/string if that's cleaner. (Assuming `is_enemy` boolean for simplicity).
2. Create the `useSessionEnemies` hook to fetch enemies.
3. Build `CreateEnemyDialog.tsx` with attribute inputs and base64 image uploader.
4. Build `SessionEnemyList.tsx` and place it in `ActiveSessionPage.tsx`.
5. Adapt the inventory view to hide trade/visibility buttons when viewing an enemy.
