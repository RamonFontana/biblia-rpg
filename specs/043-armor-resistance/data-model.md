# Data Model: Armor Resistance

## Entities

### `EquipmentItem` / `ShopItem`
*Location*: `src/features/character-creation/types/index.ts` and `src/data/itemsDb.ts`
- **New Fields**:
  - `level?: number`: The tier/level of the item (1 to 4). Defaults to 1 if undefined.
  - `conditionResistances?: string[]`: Array of condition IDs this item resists.
  - `requiredVocation?: string[]`: Array of vocation names allowed to equip this.
  - `slot?: 'head' | 'body' | '1h' | '2h' | 'shield'`: To differentiate helmets from body armors.

### `CombatEngine`
*Location*: `src/services/combatEngine.ts`
- **Logic Updates**:
  - `executeAbilityOnTarget`:
    - Fetch target's equipped items (`head`, `body`, `offHand`).
    - Look up items in `ITEMS_DB` (or character inventory).
    - If any item has `conditionResistances` including the condition being applied:
      - Calculate max `level` among those items.
      - If level 4+: Block condition completely (Immunity).
      - If level 2 or 3: Divide condition duration by 2 (Math.floor, minimum 1).
      - If level 1 or 3: Note Advantage for future saving throws (currently just narrative mitigation if saves aren't rolled).
      - Trigger UI Toast Notification if resisted.
