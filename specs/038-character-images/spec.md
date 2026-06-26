# Feature Specification: Character Images

**Feature Branch**: `038-character-images`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Colocar imagem nas fichas e cards de personagem, as imagens já estão salvas no banco, se tiver vazio, coloque uma imagem de placeholder padrão."

## Clarifications

### Session 2026-06-26
- Q: Tipo de Placeholder → A: Fundo com cor sólida contendo as iniciais do personagem (ex: "J" para João)


## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Character Image on Sheet (Priority: P1)

Users should see the customized image of their character when they open the detailed character sheet, allowing for greater immersion and personalization.

**Why this priority**: Visual representation of characters is fundamental for an RPG interface.

**Independent Test**: Open a character sheet for a character with a defined image in the database and verify the image loads correctly.

**Acceptance Scenarios**:

1. **Given** a character with a custom image in the database, **When** the user opens the character sheet, **Then** the custom image is displayed.

---

### User Story 2 - View Character Image on Cards (Priority: P1)

Users should see the character image on compact character cards (used in lists, party overviews, or combat trackers) to quickly identify characters.

**Why this priority**: Essential for quick visual identification of characters in list views.

**Independent Test**: View a list of character cards and verify that images load correctly for characters that have them.

**Acceptance Scenarios**:

1. **Given** a character with a custom image in the database, **When** the character card is rendered, **Then** the custom image is displayed on the card.

---

### User Story 3 - Missing Image Fallback (Priority: P2)

When a character doesn't have a customized image, the system should elegantly handle this by displaying a generic placeholder image, rather than a broken image link or empty space.

**Why this priority**: Ensures a consistent and polished UI even when data is incomplete.

**Independent Test**: Create or view a character without an image assigned and verify the default placeholder appears.

**Acceptance Scenarios**:

1. **Given** a character without a custom image in the database, **When** the character sheet or card is rendered, **Then** the default placeholder image is displayed.
2. **Given** an image URL in the database that fails to load (e.g., 404), **When** the character sheet or card is rendered, **Then** the default placeholder image is displayed as a fallback.

### Edge Cases

- What happens when the image URL provided by the database is invalid or returns a 404 error? (Should fall back to the placeholder).
- How does the system handle images of varying aspect ratios? (Images should be appropriately scaled, cropped, or contained within the UI components without breaking the layout).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve the image URL from the existing character database records (specifically from the JSON field `narrative.imageUrl`).
- **FR-002**: System MUST display the character's image on the detailed character sheet view.
- **FR-003**: System MUST display the character's image on character cards (e.g., in character lists, party views, or combat tracking).
- **FR-004**: System MUST display a default placeholder when the character has no custom image, rendering a solid color background containing the character's initials.
- **FR-005**: System MUST fall back to the initials placeholder if the character's custom image fails to load.
- **FR-006**: System MUST ensure images fit within their designated UI containers without distorting the aspect ratio.

### Key Entities

- **Character**: Represents a player or NPC. Contains an attribute for the image URL (which is already populated in the database according to the prompt).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of characters without custom images display the placeholder image instead of a broken image icon.
- **SC-002**: All character cards and sheets consistently display the correct images (custom or placeholder) across the application.
- **SC-003**: UI layouts do not break or shift unpredictably when loading images of different dimensions.

## Assumptions

- The database schema already has a field for the character image stored in the `narrative` JSON column under `imageUrl`.
- The images stored in the database are accessible via URL by the client application.
