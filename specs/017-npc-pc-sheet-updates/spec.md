# Feature Specification: NPC and PC Session Sheet Enhancements

**Feature Branch**: `017-npc-pc-sheet-updates`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "na ficha de NPCs na visão de mestre na sessão, não está mostrando o hp a ca e a fé, corrija isso. Comece a de fato colocar ação ao utilizar os itens, no npc adicione a opção de utilizar consumiveis e em ambos adicione a feature de quando utilizar um item, se ele tiver efeito no personagem, execute o efeito. Por exemplo cura, respeitando o hp máximo. Adcione na ficha do personagem e NPCs jogáveis as habilidades respeitando os termos de uso de cada raçã. E adicione os modificadores nos atributos pois faltaram e também proficiência."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Views Complete NPC Stats (Priority: P1)

As a Game Master, I want to see the HP, CA, and Faith of NPCs in the session view, so that I can manage combat and interactions effectively.

**Why this priority**: Without these critical stats visible during the session, the master cannot manage combat.

**Independent Test**: Can be fully tested by opening the session view as a master and checking an NPC's card.

**Acceptance Scenarios**:

1. **Given** the master is viewing an active session, **When** checking an NPC's sheet, **Then** the current and maximum HP, CA, and Faith are clearly visible.

---

### User Story 2 - Applying Consumable Effects (Priority: P1)

As a Player or Game Master, I want to be able to use consumable items from the inventory, and have their effects (like healing) automatically apply to my character's sheet without exceeding maximum values.

**Why this priority**: Reduces manual tracking and automates basic gameplay mechanics like healing.

**Independent Test**: Can be fully tested by using a healing potion from the inventory and verifying the HP increases correctly.

**Acceptance Scenarios**:

1. **Given** a PC or NPC with missing HP, **When** a healing consumable is used from the inventory, **Then** their current HP increases by the item's healing amount.
2. **Given** a character missing 5 HP, **When** they use a consumable that heals 10 HP, **Then** their HP is restored exactly to their maximum HP (does not exceed max).
3. **Given** a Game Master controlling an NPC, **When** they open the NPC's inventory, **Then** they have the option to use consumable items.

---

### User Story 3 - Displaying Racial Skills, Modifiers, and Proficiency (Priority: P2)

As a Player or Game Master, I want to see attribute modifiers, proficiency bonus, and racial skills on the character/NPC sheets, so that I know what capabilities and bonuses apply to rolls.

**Why this priority**: Essential for accurate roleplaying and dice rolling according to the game's rules.

**Independent Test**: Can be fully tested by opening a character or playable NPC sheet and verifying the modifiers, proficiency, and skills section.

**Acceptance Scenarios**:

1. **Given** a character or playable NPC sheet is opened, **When** viewing the attributes, **Then** the calculated modifier for each attribute is displayed next to the base score.
2. **Given** a character or playable NPC sheet is opened, **When** viewing the header/stats, **Then** the proficiency bonus is clearly displayed.
3. **Given** a character of a specific tribe/race, **When** viewing their skills section, **Then** the correct racial skills and passives are listed according to their level and tribe rules.

### Edge Cases

- What happens when a character's maximum HP changes while they are fully healed?
- How does the system handle an item effect that modifies stats other than HP? (Assuming only healing is implemented for now or generic effect handling).
- What happens if a consumable has no defined effect value?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The NPC sheet in the Master's session view MUST display current and maximum HP, CA (Armor Class), and Faith.
- **FR-002**: The inventory interface MUST allow Game Masters to trigger the "use" action on consumable items for NPCs.
- **FR-003**: The system MUST apply the effects of used consumables to the character's or NPC's state (e.g., restoring HP).
- **FR-004**: When restoring HP via items, the system MUST NOT allow current HP to exceed the character's maximum HP.
- **FR-005**: Character and Playable NPC sheets MUST display the calculated modifier for each base attribute.
- **FR-006**: Character and Playable NPC sheets MUST display the character's Proficiency bonus.
- **FR-007**: Character and Playable NPC sheets MUST display a list of the character's abilities/skills based on their tribe/race and level.

### Key Entities

- **Character/NPC State**: Includes HP, Max HP, CA, Faith, Attributes, Proficiency, and Skills.
- **Item/Consumable**: Represents an item in the inventory that can be used, containing effect data (e.g., healing amount).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Masters can view HP, CA, and Faith for all NPCs without opening additional dialogs.
- **SC-002**: Consumables can be used directly from the UI, automatically updating the character's state.
- **SC-003**: Character attribute modifiers and proficiency are visible on the sheet, eliminating manual calculation.
- **SC-004**: Racial skills are accurately reflected on the sheets.

## Assumptions

- Consumable items already have data structures defining their effects (e.g., `healingAmount`).
- The logic for calculating attribute modifiers and proficiency is already defined in the ruleset and can be applied to the UI.
- Racial skills are mapped in the data and can be retrieved based on the character's tribe.
