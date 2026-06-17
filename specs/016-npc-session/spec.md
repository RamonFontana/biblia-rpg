# Feature Specification: NPC Session Management

**Feature Branch**: `016-npc-session`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "crie agora na sessão na visão do mestre a listagem dos NPCs, quando clicar em um, tem que poder ver a ficha do NPC com todas informações e itens. E vamos ter que reconfigurar a parte de inseiri e ter a gestão dos itens e utilização na sessão pelo mestre do npc"

## Clarifications

### Session 2026-06-16
- Q: Como devemos modelar os NPCs de Campanha no banco de dados? → A: Adicionar uma coluna `is_npc` (boolean) na tabela `characters`. O inventário usa a tabela `character_items`. Para a sessão, eles referenciam o `character_id`.
## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Views Session NPCs (Priority: P1)

As a Game Master in an active session, I want to see a list of all NPCs present in the current session so that I can quickly access their sheets.

**Why this priority**: Essential foundation for managing NPCs in the session context.

**Independent Test**: Can be fully tested by opening the Game Master session view and verifying the presence of an NPC roster.

**Acceptance Scenarios**:

1. **Given** I am a Game Master in an active session, **When** I view the session dashboard, **Then** I see a list of NPCs currently added to the session.
2. **Given** an active session with no NPCs, **When** I view the session dashboard, **Then** I see an empty state for the NPC list.

---

### User Story 2 - Master Inspects NPC Sheet (Priority: P1)

As a Game Master, I want to click on any NPC in the session list to open their complete character sheet, including stats and items, so I can reference their capabilities during play.

**Why this priority**: Without seeing the NPC's details, the master cannot properly utilize them in the story or combat.

**Independent Test**: Can be tested by selecting an NPC from the list and verifying all attributes, info, and inventory are displayed correctly.

**Acceptance Scenarios**:

1. **Given** I am viewing the session NPC list, **When** I click on a specific NPC, **Then** their full character sheet opens in a modal or side panel.
2. **Given** the NPC sheet is open, **When** I review the content, **Then** I see their attributes, bio information, and their inventory of items.

---

### User Story 3 - Master Manages NPC Items in Session (Priority: P2)

As a Game Master viewing an NPC's sheet during a session, I want to manage (add/remove) and use the NPC's items, so I can reflect the events of the session (e.g., consuming a potion, dropping a weapon).

**Why this priority**: Interactive inventory is crucial for dynamic session events, but secondary to just viewing the NPC.

**Independent Test**: Can be tested by opening an NPC sheet, adding an item, using an item, and verifying the inventory updates.

**Acceptance Scenarios**:

1. **Given** I have an NPC sheet open, **When** I choose to use a consumable item, **Then** the item's quantity decreases or it is removed from the inventory.
2. **Given** I have an NPC sheet open, **When** I add a new item to their inventory, **Then** the item immediately appears in their item list.

---

### User Story 4 - Master Adds NPCs to Session (Priority: P2)

As a Game Master, I want a reconfigured interface to easily insert existing NPCs from my campaign into the active session roster.

**Why this priority**: Replaces/improves the current flow for adding NPCs to a session to accommodate the new management view.

**Independent Test**: Can be tested by using the "Add NPC" action to bring a created NPC into the current session state.

**Acceptance Scenarios**:

1. **Given** I am on the session dashboard, **When** I click to add an NPC, **Then** I am prompted to select an NPC from my campaign.
2. **Given** I select an NPC, **When** I confirm the insertion, **Then** the NPC appears in the session's active NPC list.

### Edge Cases

- What happens when two masters try to edit the same NPC's items simultaneously?
- How does the system handle an NPC being deleted from the campaign while they are active in a session?
- What happens if an item is "used" but the NPC's inventory is out of sync (e.g., they no longer have it)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of active NPCs in the Game Master's session view.
- **FR-002**: System MUST allow the Game Master to click on an NPC in the session list to view their full character sheet (attributes, skills, bio, items).
- **FR-003**: System MUST allow the Game Master to add new items to an active NPC's inventory during a session.
- **FR-004**: System MUST allow the Game Master to use/consume items from an active NPC's inventory during a session.
- **FR-005**: System MUST allow the Game Master to remove items from an active NPC's inventory during a session.
- **FR-006**: System MUST provide an interface for the Game Master to insert existing campaign NPCs into the current session.
- **FR-007**: System MUST sync NPC item usage and inventory changes made during the session to the NPC's persistent campaign data.

### Key Entities *(include if feature involves data)*

- **Campaign NPC / Character**: Stored in the `characters` table with an `is_npc` boolean flag to distinguish them from player characters.
- **Session NPC / Participant**: A reference linking a Campaign NPC to an Active Session (`session_participants` or an updated `session_npcs` referencing `character_id`).
- **NPC Inventory Item**: An item belonging to an NPC, stored in `character_items` and linked to the `characters` table via `character_id`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Game Masters can view an NPC's character sheet from the session view in under 2 clicks.
- **SC-002**: The Game Master can successfully add an NPC to the active session.
- **SC-003**: Using an item from an NPC's inventory updates the state without requiring a page reload.
- **SC-004**: Inventory changes made during a session persist across session reloads.

## Assumptions

- **Database Model**: The existing `characters` table will be extended with an `is_npc` boolean flag to support persistent Campaign NPCs. `character_items` will be used for their inventory.
- Assumes that the Game Master has the necessary permissions to edit NPC inventories.
- Assumes real-time updates (via Supabase) for inventory changes if multiple players/masters are viewing the session, though mainly the Master interacts with NPCs.
