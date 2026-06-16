# Feature Specification: Session Character Sheet

**Feature Branch**: `014-session-character-sheet`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "agora vamos configurar melhor a parte de usuários. O mestre e o jogador vão poder ter algumas ações relacionado aos jogadores, mas vamos configurando aos poucos. A que vamos configurar agora é ver a ficha completa do personagem, CA, PV, pericias, moderadores, itens, atribuots, etc. Quero que melhore o design dessa parte @[/Users/take5dev1/projects/rpg-biblico/src/pages/session/ActiveSessionPage.tsx:L114-L120] e configure a parte tando do mestre quanto do jogador"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Views Player Character Sheet (Priority: P1)

The GM needs to be able to see the full character sheet of any online player to manage the game, verify stats, and make decisions without having to ask the player.

**Why this priority**: Crucial for the GM to manage combat and challenges properly.

**Independent Test**: Can be tested by having a GM log into an active session and clicking on an online player to view their detailed stats (CA, PV, attributes, etc.).

**Acceptance Scenarios**:

1. **Given** the GM is in the active session page, **When** they look at the players list, **Then** the UI design should be improved to show player cards clearly.
2. **Given** the GM is viewing the players list, **When** they click on a specific player, **Then** a modal or side panel opens showing the full character sheet (CA, PV, skills, modifiers, items, attributes).

---

### User Story 2 - Player Views Their Own Character Sheet (Priority: P1)

Players need to see their own character sheet during the active session to know their capabilities, health, and inventory without leaving the session screen.

**Why this priority**: Essential for players to participate in the game effectively.

**Independent Test**: Can be tested by a player logging into an active session and viewing their own character sheet.

**Acceptance Scenarios**:

1. **Given** a player is in the active session page, **When** they look at the "Seu Personagem" (Your Character) section, **Then** they should see a beautifully designed summary of their character.
2. **Given** a player is viewing their summary, **When** they click to expand or view details, **Then** they see their full character sheet (CA, PV, skills, modifiers, items, attributes).
3. **Given** a player is in the active session page, **When** they look at the online players list, **Then** they can see who else is online but cannot see their full character sheets (or can see a restricted view).

### Edge Cases

- What happens when a player character has no items or empty fields?
- How does the system handle players who are online but haven't selected or created a character for this session yet?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an improved UI design for the online players list in the Active Session page for both GM and players.
- **FR-002**: System MUST allow the GM to view the complete character sheet (CA, PV, skills, modifiers, items, attributes) of any player in the session.
- **FR-003**: System MUST allow the Player to view their own complete character sheet.
- **FR-004**: System MUST display character sheets without leaving the active session context (e.g., via modals, side sheets, or inline expansion).
- **FR-005**: System MUST restrict players from seeing the full character sheets of other players (unless GM permissions apply).

### Key Entities

- **Game Session**: The active session containing players and the GM.
- **Character**: The character data associated with a player (CA, PV, attributes, skills, items).
- **Player**: The user participating in the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: GM can access any player's character sheet within 1 click from the active session screen.
- **SC-002**: Players can access their own character sheet within 1 click.
- **SC-003**: The UI design for the players list looks cohesive and provides visual feedback (hover states, clear separation).

## Assumptions

- Players have already created their characters and they are associated with their user profile or the session.
- The character schema (CA, PV, attributes, skills, items) already exists in the database and is accessible via Supabase.
- Real-time updates to the character sheet (like losing PV) are out of scope for this specific UI reading task, though the view should support future real-time binding.
