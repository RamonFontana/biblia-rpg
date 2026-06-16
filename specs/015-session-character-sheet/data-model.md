# Data Model: Character Sheet Items and Actions

## New Tables

### `items`
Defines the base items available in the game system.
- `id`: UUID, Primary Key
- `name`: String, Not Null
- `description`: Text, Nullable
- `category`: String, Not Null (e.g., 'Armas', 'Armaduras', 'Consumíveis', 'Ferramentas')
- `is_consumable`: Boolean, Default `false`
- `requires_target`: Boolean, Default `false`
- `is_kit`: Boolean, Default `false`
- `weight`: Numeric, Default 0
- `created_at`: Timestamptz, Default `now()`

### `kit_items`
Defines which items are contained within a specific kit.
- `id`: UUID, Primary Key
- `kit_id`: UUID, Foreign Key to `items.id`, On Delete Cascade
- `item_id`: UUID, Foreign Key to `items.id`, On Delete Cascade
- `quantity`: Integer, Default 1

### `character_items`
Maps items to characters (inventory).
- `id`: UUID, Primary Key
- `character_id`: UUID, Foreign Key to `characters.id`, On Delete Cascade
- `item_id`: UUID, Foreign Key to `items.id`, On Delete Cascade
- `quantity`: Integer, Default 1
- `created_at`: Timestamptz, Default `now()`

## RPC Functions

### `add_kit_to_character(p_character_id UUID, p_kit_id UUID)`
- Description: Adds all items contained in a kit directly to a character's inventory. If the character already has the item, it increments the quantity.
- Logic:
  1. Select all rows from `kit_items` where `kit_id = p_kit_id`.
  2. For each row, `INSERT INTO character_items` ... `ON CONFLICT (character_id, item_id) DO UPDATE SET quantity = character_items.quantity + EXCLUDED.quantity`.
  *(Note: requires adding a unique constraint on `(character_id, item_id)` in `character_items`)*

### `use_consumable_item(p_character_item_id UUID, p_target_character_id UUID NULL)`
- Description: Decrements the quantity of a consumable item and deletes the record if the quantity reaches 0.
- Logic:
  1. Fetch `character_items` row and join `items` to verify `is_consumable = true`.
  2. If `quantity > 1`, `UPDATE character_items SET quantity = quantity - 1`.
  3. If `quantity = 1`, `DELETE FROM character_items`.
  4. (Future) Apply effects to `p_target_character_id` if provided.

## Constraints & Indexes
- **Unique Constraint**: `character_items(character_id, item_id)` to easily merge quantities.
- **Index**: On `character_items(character_id)` for fast inventory queries.
- **Index**: On `kit_items(kit_id)` for fast kit expansion.
