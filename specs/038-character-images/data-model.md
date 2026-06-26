# Data Model: Character Images

No changes to the data model are required for this feature. The character image URL is already being stored in the existing `characters` table within the `narrative` JSONB column as `imageUrl`.

## Entities

- **Character (`characters` table)**
  - `narrative.imageUrl`: A string containing the URL or Base64 encoding of the character's image. Existing data will be utilized as-is.
