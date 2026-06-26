# Research: Character Images

## Decisions

- **Decision 1: Image Source**: The image URL will be retrieved from the `narrative.imageUrl` field in the character's JSON structure.
- **Decision 2: Fallback Placeholder**: When the `imageUrl` is missing or fails to load, the system will render a solid color background containing the character's initials as a placeholder. This approach is highly readable, standard, and avoids external dependencies.
- **Decision 3: Display Locations**: The image will be added to the `PlayerCombatView` (representing the active player character's context or cards in a list) and the `CharacterSheet` (or equivalent details view). 
- **Decision 4: Layout & Responsiveness**: The images will be displayed as rounded circles (standard avatar style), using Tailwind's `w-12 h-12` or similar classes for cards, and `w-24 h-24` for detailed sheets. CSS `object-cover` will ensure aspect ratio is maintained without distortion.

## Rationale

- Using initials with a solid color is lightweight and avoids broken image links if an external placeholder service fails.
- The `narrative.imageUrl` is already populated in the database for characters with images.
- Tailwind classes ensure responsiveness and consistency with existing design patterns in the RPG interface.
