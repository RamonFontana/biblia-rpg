# Feature Specification: Enemy List

**Feature Branch**: `024-enemy-list`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "crie a lista de inimigos, cada inimigo tem que ter ficha de personagem normal que nem os jogadores, mas tem que ter a alteração de items do npc. Não precisa deixar visivel para os jogadores, só para o mestre. E não precisa ter botão de negociar ou botão de deixar visivel ou não"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Views Enemy List (Priority: P1)

As a Game Master, I want to access a private list of enemies so that I can manage their sheets and items during the session.

**Why this priority**: Managing enemies is core to combat and session running. It needs a dedicated area that players cannot access.

**Independent Test**: Can be tested by logging in as Master, navigating to the enemy list section, and verifying that the list displays and is inaccessible to standard players.

**Acceptance Scenarios**:

1. **Given** I am logged in as a Master, **When** I navigate to the session or character area, **Then** I see an option to access the "Enemy List".
2. **Given** I am a Player, **When** I look at the session dashboard, **Then** I do not see the "Enemy List" option.

---

### User Story 2 - Enemy Character Sheet Management (Priority: P1)

As a Game Master, I want each enemy to have a standard character sheet just like players, so that combat stats, attributes, and skills are handled uniformly.

**Why this priority**: Enemies need full mechanical support (attributes, HP, etc.) exactly like players to interact properly with the game mechanics.

**Independent Test**: Can be tested by opening an enemy from the list and verifying it contains the same fields and structure as a player character sheet.

**Acceptance Scenarios**:

1. **Given** I am in the Enemy List, **When** I select an enemy, **Then** their full character sheet is displayed identically to a player character sheet.
2. **Given** an enemy character sheet is open, **When** I edit attributes or HP, **Then** the changes are saved correctly.

---

### User Story 3 - Enemy Item Management (Priority: P2)

As a Game Master, I want to manage enemy inventory using the NPC item alteration interface, without trading options, so that I can add or remove loot/equipment.

**Why this priority**: Enemies drop loot and use items. The GM needs an easy way to manage their inventory using existing NPC item systems but simplified for enemies.

**Independent Test**: Can be tested by opening the inventory section of an enemy sheet and verifying that items can be added/removed, but no "Negotiate" or "Toggle Visibility" buttons exist.

**Acceptance Scenarios**:

1. **Given** I am viewing an enemy character sheet, **When** I navigate to the items section, **Then** I see the NPC item alteration interface.
2. **Given** I am viewing the enemy items section, **When** I look for trading options, **Then** there is no "Negotiate" button.
3. **Given** I am viewing the enemy items section, **When** I look for visibility toggles, **Then** there is no "Make Visible/Hidden" button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated "Enemy List" view accessible ONLY by the Game Master.
- **FR-002**: System MUST restrict regular players from viewing or accessing the Enemy List.
- **FR-003**: System MUST display a standard character sheet for each enemy, mirroring the player character sheet structure.
- **FR-004**: System MUST allow the GM to manage enemy items using the NPC inventory alteration interface.
- **FR-005**: System MUST NOT display a "Negotiate" (Trade) button on the enemy item interface.
- **FR-006**: System MUST NOT display a "Toggle Visibility" button on the enemy item interface.

### Key Entities

- **Enemy**: A specialized character record that uses the standard character sheet data structure but is flagged as an enemy/NPC for GM use only.
- **Enemy Inventory**: The collection of items held by the enemy, managed through the NPC item interface without trade functions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Game Masters can successfully navigate to and view the Enemy List without errors.
- **SC-002**: Regular players are completely blocked from accessing the Enemy List.
- **SC-003**: The enemy character sheet contains 100% of the mechanical fields available to a standard player character.
- **SC-004**: The GM can successfully add or remove items from an enemy's inventory in under 3 clicks per item.
- **SC-005**: The "Negotiate" and "Toggle Visibility" buttons are provably absent from the enemy inventory interface.

## Assumptions

- Assumes the existing "Player Character Sheet" components can be reused or extended for enemies.
- Assumes the existing "NPC Item Alteration" components can be configured to hide trade/visibility buttons.
- Assumes there is an existing mechanism to identify if a user is the "Master" of the session.
