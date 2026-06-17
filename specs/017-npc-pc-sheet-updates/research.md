# Research & Decisions

## 1. How to show HP, CA, and Faith for simple NPCs in Session List
**Decision**: Update `useSessionNPCs.ts` to map the `stats` field from `session_npcs` into the returned NPC objects. Currently, it's ignoring the `stats` field for non-playable NPCs. Also, update `SessionNPCList.tsx` to display these stats inline on the NPC card (since non-playable NPCs can't open the full sheet), or allow opening the sheet for all NPCs. We will allow opening the sheet for all NPCs, falling back gracefully if data is missing.
**Rationale**: Easiest way to fulfill the requirement without massive UI changes.

## 2. Consumable Item Effects (Healing)
**Decision**: We will add a new column `effects` (JSONB) to the `items` table via a Supabase migration. The structure will be `{"heal": 10}` for a healing potion.
When `useItem` is triggered from the inventory UI, the frontend will read this `effects` object.
If `heal` is present, it will calculate `new_pv = Math.min(stats.pv + effects.heal, stats.max_pv || stats.pv)`. Wait, we need to track `current_pv` separately from `max_pv`. We will introduce `current_pv` into the `stats` JSONB object for both characters and NPCs. 
If an item has no effect on the user (e.g. rope), the use action will simply decrement/remove the item from inventory without modifying character stats.
**Rationale**: Adding JSONB `effects` allows flexible scaling for future item effects (like `restore_faith`, `buff_for`). Doing the effect application in the frontend simplifies the immediate implementation before we need a complex rules engine in the backend.

## 3. Attribute Modifiers and Proficiency
**Decision**: Create utility functions to calculate modifiers `Math.floor((value - 10) / 2)` and proficiency (assuming level 1 for now, which is +2, since level isn't in the schema yet). These will be displayed in `CharacterSheetView.tsx`.
**Rationale**: Standard D&D 5e math, which the game uses as a base.

## 4. Racial Skills
**Decision**: We will create a static mapping file `src/data/tribeSkills.ts` that maps each tribe name to their initial passives (Level 1), based on the documentation in `docs/tribos/`. The `CharacterSheetView.tsx` will read from this mapping based on the character's `tribe` field and display the skills.
**Rationale**: Avoids database complexity for static rules text. It's the standard way to handle race/class features in frontend RPG apps.
