# Research: Enemy List

## Decision: Data Model for Enemies
**Decision**: We will reuse the `characters` table for enemies but add an `is_enemy` flag to distinguish them from playable NPCs and Player Characters.
**Rationale**: The spec mandates that enemies have a "normal character sheet just like players". Reusing the `characters` table ensures 100% compatibility with `CharacterSheetView` without duplicating the UI or data structure.
**Alternatives considered**: Creating a separate `enemies` table. Rejected because it would require duplicating the complex character sheet logic and UI.

## Decision: Enemy Items Management
**Decision**: Create a modified version of the `NPCInventory` or `Trade` interface specifically for enemies that hides the "Negotiate" and "Toggle Visibility" buttons, or extend the existing `CharacterSheetView` inventory section to hide these buttons if the character is an enemy.
**Rationale**: Easiest way to satisfy FR-004, FR-005, and FR-006.

## Decision: Enemy Creation
**Decision**: The `CreateEnemyDialog` will include a step/section to define base attributes (FOR, DES, CON, INT, SAB, CAR) which can have standard default values but be editable. It will also allow uploading a Base64 image.
**Rationale**: Directly addresses user request for attribute definition and image upload during enemy creation.
