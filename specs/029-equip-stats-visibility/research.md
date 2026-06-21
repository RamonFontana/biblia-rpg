# Research: Equip Stats Visibility

## 1. AC State Reactivity Error

**Problem**: The user reported that AC doesn't increase when equipping an item.
**Investigation**: 
- `CharacterSheetView` dynamically calculates AC (`totalAc = baseAc + bonusAc`).
- `ActiveSessionPage` does the same using a local `getEntityCombatStats(character)` function.
- **However**, in the GM/Player view lists (`SessionEnemyList.tsx`, `SessionNPCList.tsx`, and `PlayerCard.tsx` inside `SessionParticipantList.tsx`), the CA displayed is hardcoded to `character.stats.ca ?? 10`. It completely ignores the equipment bonuses!
- The realtime subscriptions in `useSessionNPCs`, `useSessionPlayerCharacters`, and `useSessionEnemies` already fetch and preserve the `character_items` array while listening for `characters` table updates on the `equipment` JSON field.
- **Decision**: We need to extract the logic from `getEntityCombatStats` into `src/lib/equipmentUtils.ts` (e.g., `getCombatStats(character: any)`) and use it in `PlayerCard`, `SessionEnemyList`, and `SessionNPCList` to correctly display dynamically calculated `totalAc`.

## 2. Damage Die and AC Bonus in Equipment Slots

**Problem**: The user wants to see the damage die for weapons and AC increase for armors in the inventory, particularly when equipped.
**Investigation**:
- `InventoryList.tsx` already displays `Dano: {damageDie}` and `CA +{bonus}` for items in the inventory.
- `EquipmentSlots.tsx` renders the currently equipped items (Head, Body, Main Hand, Off Hand) but only shows the item name (e.g. `mainHandItem.items.name`) and proficiency status.
- **Decision**: Update `EquipmentSlots.tsx` to read the `effects` of the equipped item (e.g., `mainHandItem.items.effects`) and render the damage die (if weapon) and AC bonus (if armor or shield) directly under the item name.

## 3. Supabase MCP Consideration

**Problem**: The user asked to consider the Supabase MCP.
**Investigation**:
- We evaluated if we need to modify the DB schema.
- Since AC is dynamically computed by summing the base AC (`stats.ca`) and the equipped items' effects (`effects.acBonus`, `effects.ca`, `effects.armorClass`), we **do not** need to change any Supabase tables or add database triggers for this feature. Reactivity on the frontend handles it properly once the UI components are wired to the computed AC.
- **Decision**: No database migrations are required.
