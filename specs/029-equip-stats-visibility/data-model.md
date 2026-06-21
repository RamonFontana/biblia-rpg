# Data Model: Equip Stats Visibility

## Entities

There are no database schema changes required for this feature.

The existing `characters` table contains the following fields used for this feature:
- `stats` (JSONB): Contains the base `ca` (Armor Class).
- `equipment` (JSONB): Contains the IDs of items equipped in `head`, `body`, `mainHand`, and `offHand` slots.

The existing `character_items` table links a character to an item from the `items` catalog, containing:
- `items` (Relation): Returns the item data including `effects` (JSONB), which holds `damageDie` and AC bonuses (`ca`, `acBonus`, `armorClass`).

## Frontend State

A new utility function `getCombatStats(character: any)` will compute:
- `totalAc`: Base CA + CA bonuses from equipped items.
- `weapon`: Details about the currently equipped weapon.

This ensures dynamic reactivity across all views (PlayerCard, SessionEnemyList, SessionNPCList) without requiring redundant database columns.
