# Feature Specification: Session Character List Improvement

**Feature Branch**: `022-session-character-list`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "quero configurar melhor a listagem de jogadores, que na verdade a terminologia seria listagem de personagens. Na visão do jogador, ele tem que poder ver o mestre e separado cada npcs e os outros personagens. Aonde está o nome do personagem como fontanaramon por exemplo, tem que ficar o nome do perosnagem com um subtitulo sendo o nome do jogador. E tem que ter a opção de o mestre na visão dele, esconder e exibir o npc, e por padrão ele ser escondido. E quando ele esconder o npc, só o mestre vai poder ver ele, mas os jogadores não."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Differentiated Character Listing (Priority: P1)

As a player in a session, I want to see the participants divided into clear groups (Master, NPCs, and Player Characters) and see the character's name as the main text with the player's name as a subtitle, so I can better immerse myself in the game and easily identify who is who.

**Why this priority**: Essential for immersion and clarity during the game session. It solves the terminological issue of "players" vs "characters".

**Independent Test**: Can be fully tested by joining a session as a player and verifying the presence of distinct sections (Master, NPCs, Characters) and checking that character names are prominent with player names as subtitles.

**Acceptance Scenarios**:

1. **Given** I am a player in an active session, **When** I view the participant list, **Then** I see separate sections or clear visual separations for the Master, NPCs, and Player Characters.
2. **Given** I am looking at a player character in the list, **When** I read their entry, **Then** the main title is the Character's Name and the subtitle is the Player's Name.

---

### User Story 2 - Master Control over NPC Visibility (Priority: P1)

As the Master of a session, I want to be able to show or hide individual NPCs from the players' view, with them being hidden by default, so I can reveal them only when they appear in the story.

**Why this priority**: Crucial tool for the Game Master to manage the flow of information and avoid spoilers for the players.

**Independent Test**: Can be fully tested by the Master creating an NPC and verifying it does not appear on the players' screens, then toggling its visibility and verifying it appears.

**Acceptance Scenarios**:

1. **Given** a newly added or existing NPC, **When** the Master views the session list, **Then** the NPC is marked as hidden by default.
2. **Given** an NPC that is hidden, **When** a player views the session list, **Then** the NPC does not appear on their screen.
3. **Given** an NPC that is hidden, **When** the Master toggles it to be visible, **Then** the NPC immediately becomes visible on the players' screens.
4. **Given** an NPC that is visible, **When** the Master toggles it to be hidden, **Then** the NPC immediately disappears from the players' screens.

### Edge Cases

- What happens when a player's connection drops and reconnects? (Visibility state must remain consistent with the Master's settings).
- What happens if the Master changes an NPC's visibility while players have the session list open? (The UI must update in real-time to reflect the change).
- What happens if the Master refreshes the page? (The visibility state of NPCs must persist and be reloaded correctly).
## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST rename UI labels from "Jogadores" (Players) to "Personagens" (Characters) where applicable in the session list context.
- **FR-002**: System MUST display the Master visually distinct or in a separate category from other participants.
- **FR-003**: System MUST display NPCs in a separate category from Player Characters.
- **FR-004**: System MUST display Player Characters in their own category.
- **FR-005**: System MUST display the Character's Name as the primary identifier (title) for any list entry.
- **FR-006**: System MUST display the Player's Name as a secondary identifier (subtitle) under the Character's Name.
- **FR-007**: System MUST allow the Master to toggle the visibility status (hidden/visible) of any NPC.
- **FR-008**: System MUST set the default visibility status of any NPC to "hidden".
- **FR-009**: System MUST NOT display "hidden" NPCs to any user who is not the Master.
- **FR-010**: System MUST display all NPCs (both hidden and visible) to the Master, with a visual indicator of their current visibility status.

### Key Entities

- **Participant/Character List Entry**: Represents a user or NPC in the session. Contains `characterName`, `playerName`, `role` (Master, Player, NPC), and `visibilityStatus` (visible, hidden).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: 100% of characters in the session list display the Character Name as the main title and Player Name as the subtitle.
- **SC-002**: 100% of newly created NPCs are hidden from players by default.
- **SC-003**: The Master can toggle NPC visibility with a single click/action per NPC.
- **SC-004**: Players never see NPCs that are marked as hidden.

## Assumptions

- The system already has a way to distinguish between the Master, Player Characters, and NPCs.
- The session interface can accommodate multiple distinct list sections.
- The underlying database or state management supports adding a visibility flag to NPCs.
