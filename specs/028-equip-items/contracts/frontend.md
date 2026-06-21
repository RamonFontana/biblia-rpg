# Frontend UI Contracts

## Inventory Components

The frontend will need components to manage equipped items and the inventory.

### `EquipmentSlots`
Displays the currently equipped items for Head, Body, Main Hand, and Off Hand.
**Props**:
- `equipment: CharacterEquipment | null`
- `onUnequip: (slot: keyof CharacterEquipment) => void`

### `InventoryList`
Displays the available items. Needs to support an "Equip" action for equipable items.
**Enhancements**:
- When clicking "Equip", if the item is a 1H weapon, ask the user if they want to equip in Main Hand or Off Hand (if both could be valid). Alternatively, default to Main Hand if empty, then Off Hand.

## Supabase Updates
When equipping/unequipping, we call standard Supabase `update` on `characters`:
```typescript
supabase.from('characters').update({ equipment: newEquipmentJson }).eq('id', characterId)
```
