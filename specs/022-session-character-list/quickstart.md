# Quickstart: Session Character List Improvement

This guide helps developers understand the changes introduced in this feature.

## Changes Overview

1. **Database**: A new `is_visible` boolean column (default `false`) was added to the `session_npcs` table.
2. **UI Structure**: The Session List has been reorganized into three distinct categories:
   - **Master**
   - **Characters** (Player Characters)
   - **NPCs** (Non-Player Characters)
3. **Card Display**: For characters and the master, the primary text is the Character's Name, and the secondary text (subtitle) is the Player's Name.
4. **Visibility Control**: The Master has an eye icon (toggle button) on each NPC card to change its `is_visible` status. Players only receive data for NPCs that have `is_visible = true`.

## Testing the Changes

1. **Setup**: Run Supabase migrations to add `is_visible` to `session_npcs`.
2. **Master View**: Enter a session as a Master. Add an NPC. Verify the NPC shows up under the "NPCs" section with an "eye-off" icon (hidden).
3. **Player View**: Open an incognito window, log in as a player, and join the session. Verify the NPC is NOT visible in the list.
4. **Interaction**: As the Master, click the "eye-off" icon to make it "eye-on". Verify the NPC instantly appears in the player's view.
