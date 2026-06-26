# Data Model: Healing Consumables

## 1. Entity: Consumable Item (Database `items` table)

The `items` table stores items, which have an `effects` column (JSONB).

### Updated `effects` JSON schema for healing consumables:
- `heal` (number, optional): The fixed amount of HP the item restores (e.g., `2`).
- `heal_dice` (string, optional): The dice notation representing the variable amount of HP the item restores (e.g., `"1d6"`).

**Validation Rules:**
- `heal` and `heal_dice` are mutually exclusive. An item should have either one or the other, not both, for display purposes.

## 2. UI Component Data Flow

- The `InventoryList` component receives an array of `inventoryItems`.
- Each `item` in this array maps to `item.items.effects`.
- The UI will check for `item.items.effects.heal_dice` or `item.items.effects.heal` and render a `❤️ [value]` badge if either is present.
