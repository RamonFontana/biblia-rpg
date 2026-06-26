# Quickstart: Healing Consumable Display

This feature updates the active session inventory interface to display healing values of consumable items directly on the item's row, fulfilling the requirement for players to know exactly how much an item heals before using it.

## Where to find the changes

1. **`src/components/inventory/InventoryList.tsx`**: Look for the component that maps over `groupedItems`. Near where the `items.is_consumable` button "Usar" is displayed, you will now see a visual badge (e.g. `❤️ 1d6`) indicating the item's healing power.

## How to Test
1. Make sure you have a character with an item in their inventory that has `{"heal": 5}` or `{"heal_dice": "1d6"}` in its `effects` column.
2. Open the active session view for that character.
3. Open the "Inventário" tab.
4. Verify the badge appears correctly alongside the item name or tags.
