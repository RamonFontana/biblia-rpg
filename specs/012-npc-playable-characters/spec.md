# Feature Specification: NPC Playable Characters Enhancement

**Feature Branch**: `012-npc-playable-characters`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "temos que mlhorar essa parte, pq pode ser criado um npc só com nome e descrição, ou um personagem jogavel que vai acompanhar o time, e esse personagem jogavel vai acompanhar os jogadores em algum momento. Nem que crie alguns presets para ficar mais facil a criação, mas precisa ter ficha do personagem."

## Clarifications

### Session 2026-06-16

- Q: Data Modeling for Playable NPCs → A: Salvar na tabela `characters` e vincular à sessão via `session_participants`.
- Q: UX Flow for Creating Playable NPCs → A: Open a Modal / Slide-over with the full character creation form.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Simple NPC (Priority: P1)

As a Master, I want to be able to create a simple NPC providing only their name and a brief description, so that I can quickly add minor characters to my session without worrying about attributes.

**Why this priority**: Preserves the existing functionality and caters to the most common use case for minor NPCs.

**Independent Test**: Can be fully tested by adding a simple NPC through the UI and ensuring only name and description are requested and saved.

**Acceptance Scenarios**:

1. **Given** I am on the NPC creation step, **When** I choose to create a "Simple NPC" and fill in the name and description, **Then** the NPC is added to the session list with just those details.

---

### User Story 2 - Create an NPC with a Character Sheet (Priority: P1)

As a Master, I want to create an NPC that functions as a Playable Character (with a complete character sheet), so that they can accompany the players and participate in combat or skill checks.

**Why this priority**: This is the core new requirement enabling complex companions for the players.

**Independent Test**: Can be fully tested by selecting the "Full Character Sheet" option, filling out the required attributes, and verifying the data is saved correctly.

**Acceptance Scenarios**:

1. **Given** I am on the NPC creation step, **When** I choose to create a "Playable NPC", a Modal or Slide-over opens for me to fill out their full character sheet (stats, class, etc.), **Then** the NPC is added to the session with all their playable attributes.


---

### User Story 3 - Select NPC from Presets (Priority: P2)

As a Master, I want to select from a list of pre-configured NPC presets (both simple and playable), so that I can quickly populate my session without having to build characters from scratch.

**Why this priority**: Greatly enhances usability and speeds up the session preparation process, but isn't strictly required for the feature to function.

**Independent Test**: Can be fully tested by selecting a preset from a dropdown or list and verifying the form auto-fills with the preset's data.

**Acceptance Scenarios**:

1. **Given** I am on the NPC creation step, **When** I select an NPC preset, **Then** the creation form is automatically populated with the preset's name, description, and (if applicable) character sheet details.

### Edge Cases

- What happens when a user starts creating a Full Character Sheet NPC but switches back to Simple NPC?
- How does the system handle an incomplete character sheet for a Playable NPC during validation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to choose between creating a "Simple NPC" or a "Playable NPC".
- **FR-002**: System MUST capture Name and Description for Simple NPCs.
- **FR-003**: System MUST capture full character sheet data (attributes, skills, equipment, etc.) for Playable NPCs.
- **FR-004**: System MUST provide a set of predefined NPC presets that the user can select to auto-fill the creation form.
- **FR-005**: System MUST allow editing or removing NPCs after they have been added to the session draft.

### Key Entities

- **Simple NPC**: Represents a non-playable character with minimal data (Name, Description). Saved in `session_enemies` with `type = 'npc'`.
- **Playable NPC**: Represents a companion or key character with a full character sheet (Extends Simple NPC with stats, class, tribo, etc.). Saved in the `characters` table and linked to the session via `session_participants`.
- **NPC Preset**: A template containing predefined values for either a Simple or Playable NPC.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Masters can create a Playable NPC with a full character sheet during session setup.
- **SC-002**: Masters can select from at least 3 predefined NPC presets to speed up creation.
- **SC-003**: Existing functionality to create simple NPCs remains intact and takes less than 30 seconds per NPC.

## Assumptions

- The data structure for a "full character sheet" will reuse or mirror the existing Player Character sheet structure.
- Presets will be hardcoded or fetched from an existing database of templates, not necessarily requiring a new UI for the Master to create their own global presets right now.
