# Quickstart: Character Sheet Items and Actions

To test this feature in local development:

1. **Database Migration**:
   - Run `npx supabase db push` (or `npx supabase migration up`) after the new migrations for `items` and `character_items` are created.

2. **Seeding**:
   - You will need to seed the `items` table with some basic items, like "Poção de Cura" (consumable), "Espada Longa" (arma), and a kit like "Kit de Aventureiro".
   - You will need to seed the `kit_items` table to link the kit to its contents.

3. **Running the App**:
   - Start the Vite dev server: `npm run dev`
   - Navigate to the Session view for a test game session.
   - Assign a character to your user and join the session.
   - Open the character sheet on the side to view your categorized inventory.
   - Click on your character's token on the map to open the context menu.
   - Click "Usar" on a consumable item in the context menu to see it decrement and update both your screen and the GM's screen in real-time.
