# Research: Healing Consumable Display

## Context
Displaying the healing values (either fixed like "2 PV" or dice-based like "1d6") for consumable items in the session interface (`InventoryList`).

## Decisions

- **Decision 1: Data Model Representation**: 
  - **Decision**: Introduce a mutually exclusive `heal_dice` (string) field alongside the existing `heal` (numeric) field in the `effects` JSONB object.
  - **Rationale**: User confirmed we only need either a fixed value or a dice roll. Mutually exclusive fields are simple and unambiguous.

- **Decision 2: Visual Representation**:
  - **Decision**: Display a green badge with a heart icon (e.g., `❤️ 1d6` or `❤️ 2 PV`) next to the consumable item name.
  - **Rationale**: Ensures the healing properties are instantly recognizable in the heat of combat without cluttering the UI, fulfilling FR-004.

- **Decision 3: Target UI Component**:
  - **Decision**: Update `src/components/inventory/InventoryList.tsx` where consumables are rendered in the player's inventory list.
  - **Rationale**: This is the primary component where players interact with consumables during an active session.

## Alternatives Considered
- Visual alternatives included simple green text or a secondary description below the item name, but the badge was chosen for better scannability.
- Combining fixed and variable healing (e.g. `1d6 + 2`) was considered but dismissed as out-of-scope based on user feedback.
