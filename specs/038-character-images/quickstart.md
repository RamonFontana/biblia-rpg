# Quickstart: Character Images

## Overview
This feature introduces character images to the RPG interface, extracting the image URL from the character's `narrative.imageUrl` JSON field and displaying it in combat views, character lists, and detailed character sheets. A solid-color circle with the character's initials acts as the default fallback.

## Implementation Details

### Component 1: `Avatar` or `CharacterImage`
- A shared UI component to display the image.
- **Props**: `imageUrl` (optional), `name` (string), `className` (optional for size overriding).
- **Behavior**: If `imageUrl` is present and loads successfully, display it via an `<img>` tag with `object-cover`, `rounded-full`, and size classes. If missing or broken, display a `div` with a solid background color (e.g., `bg-primary/20`), text color (e.g., `text-primary`), and the first 1-2 letters of the `name`.

### Component 2: `PlayerCombatView` (and others)
- Integrate the new `CharacterImage` component into the header or near the character's name in `PlayerCombatView.tsx`.
- Pass `character.narrative?.imageUrl` and `character.name` to the component.

### Safety & Responsiveness
- Ensure `className` usage uses generic dimension constraints (e.g., `w-12 h-12` or `w-24 h-24`).
- No hardcoded absolute positioning that could break mobile layouts.

## Verification
- Load a session with a character possessing an image: verify the image displays on the combat view.
- Load a character without an image: verify the initials display.
- Ensure the layout of cards and sheets does not expand unpredictably or break responsiveness when the image is inserted.
