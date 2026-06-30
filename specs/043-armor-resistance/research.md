# Research: Armor Resistance

## Unknown: Resistance Level Calculation
- **Decision**: Use the item's `level` property to determine resistance tier instead of specifying levels per condition.
- **Rationale**: User requested that items respect the armor's level for the resistance flow. This simplifies data entry (a level 3 armor automatically grants level 3 resistance to whatever conditions it resists).
- **Alternatives considered**: Using a map of condition -> level (discarded per user feedback).

## Unknown: Head Armors
- **Decision**: Ensure helmets and headwear are added to `ITEMS_DB` mapped to the `head` slot, with proper `level` and `conditionResistances`.
- **Rationale**: User explicitly reminded to include head armors.

## Unknown: UI Vocation Filter
- **Decision**: The shop/inventory UI will check `item.requiredVocation` against the character's vocation. If it doesn't match, the item is visually disabled or shows a "Not usable by your vocation" badge.
- **Rationale**: Fulfills the requirement to prevent invalid equips.
