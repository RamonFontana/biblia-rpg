# Research: Character Sheet Items and Actions

## Decision 1: Kit Expansion Mechanism
- **Context**: When a player acquires a "Kit" (e.g., Explorer's Kit), the spec requires it to be expanded into its constituent items in the database.
- **Decision**: Create a PostgreSQL RPC (Remote Procedure Call) `add_kit_to_character(p_character_id, p_kit_id)` to handle the expansion atomically on the database side.
- **Rationale**: Prevents partial inserts if the frontend loses connection during a batch insert. It also keeps the business logic of kit expansion centralized in the DB.
- **Alternatives considered**: Frontend batch inserts (rejected due to lack of atomicity without complex transaction handling on the client side).

## Decision 2: Consumable Utilization
- **Context**: Players can use consumable items, which decrements their quantity or deletes the record.
- **Decision**: Create a PostgreSQL RPC `use_consumable_item(p_character_item_id, p_target_character_id)` that decrements the quantity, deletes the row if it hits 0, and returns the result. 
- **Rationale**: Ensures thread safety and prevents race conditions if a user clicks "Use" multiple times quickly.
- **Alternatives considered**: Frontend doing a `SELECT` then `UPDATE` / `DELETE` (rejected due to race conditions).

## Decision 3: Token Context Menu Implementation
- **Context**: Clicking a token in the game session needs to show a context menu with items and actions.
- **Decision**: Implement a floating UI component using fixed/absolute positioning that listens to click events on tokens. 
- **Rationale**: Standard approach for building context menus in web apps.
- **Alternatives considered**: Modal dialogs (rejected because they block the view and take the user out of the map context).
