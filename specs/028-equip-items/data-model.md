# Data Model: Sistema de Equipamentos e Inventário

## Entities

### `CharacterEquipment`
Reflects the JSON structure stored in `characters.equipment` in the database.
```typescript
interface CharacterEquipment {
  head: string | null;      // character_item_id
  body: string | null;      // character_item_id
  mainHand: string | null;  // character_item_id
  offHand: string | null;   // character_item_id
}
```

### `ItemEquipavel` (Extended from `Item`)
The catalog item (`items` table) will use the `effects` JSON column to store properties:
```typescript
interface ItemEffects {
  slot?: 'head' | 'body' | '1h' | '2h' | 'shield';
  acBonus?: number;       // For armor and shields
  damageDie?: string;     // e.g. "1d8", "1d6"
  damageType?: string;    // e.g. "cortante", "perfurante"
  properties?: string[];  // e.g. ["Versátil", "Acuidade"]
  stealthDisadvantage?: boolean;
}
```

## Relationships
- **Character to Equipped Items**: Stored inline as JSON (`characters.equipment`). The values in the JSON are Foreign Keys pointing to the `character_items` table's `id`.
- **Character Items to Base Items**: Each `character_items` row points to `items.id`.

## Validation Rules
1. **Slot Restrictions**: A `character_item` can only be equipped in a slot that matches its `ItemEffects.slot` definition.
2. **Two-Handed**: If an item is `2h`, it MUST occupy both `mainHand` and `offHand`.
3. **Versatile**: If an item has "Versátil" and `offHand` is null, it applies its Versatile damage die (typically a larger die).
4. **Conflicts**: Equipping an item in an occupied slot replaces the old item. Equipping a `2h` weapon un-equips whatever is in `mainHand` and `offHand`.
