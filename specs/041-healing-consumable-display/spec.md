# Feature Specification: Healing Consumable Display

**Feature Branch**: `[041-healing-consumable-display]`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Precisa que os itens consumíveis de cura mostre os dados que precisa jogar (EX: 1d6) ou o PV absoluto que ele vai curar. Isse estou fando dentro da sessão nos lugares que aparece o item consumiveis"

## Clarifications

### Session 2026-06-26

- Q: Como representar dados de cura variável (rolagens) no JSON effects? → A: Novo campo `heal_dice` (ex: `{"heal_dice": "1d6"}`)
- Q: O que exibir quando houver múltiplos valores de cura no item? → A: Um item terá ou `heal` ou `heal_dice` de forma mutuamente exclusiva, nunca ambos.
- Q: Como exibir visualmente o valor de cura na interface? → A: Usar uma badge (etiqueta) colorida com ícone (ex: `❤️ 1d6` ou `❤️ 2 PV`) ao lado do nome do item.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Healing Details (Priority: P1)

As a player in an active session, I want to see the exact healing value (like "1d6" or "5 PV") on my consumable healing items, so that I know exactly how much health they will restore before using them.

**Why this priority**: Essential for tactical decisions during combat or resource management. Without knowing the healing value, players might waste items or under-heal.

**Independent Test**: Can be fully tested by looking at the player's inventory during an active session and verifying that a healing item displays its healing effect.

**Acceptance Scenarios**:

1. **Given** a player is in an active session with a healing consumable that restores fixed HP, **When** they view the item in their inventory, **Then** the absolute HP value (e.g., "5 PV") is prominently displayed.
2. **Given** a player is in an active session with a healing consumable that restores variable HP, **When** they view the item in their inventory, **Then** the dice notation (e.g., "1d6") is prominently displayed.

---

### Edge Cases

- How does the system handle consumable items that do not heal PV but restore other attributes (like stamina or mana)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the healing effect value for consumable healing items on the session interface where items are listed.
- **FR-002**: The system MUST support and correctly display fixed healing values (absolute PV).
- **FR-003**: The system MUST support and correctly display variable healing values represented by dice notation (e.g., "1d6", "2d4").
- **FR-004**: The system MUST display the healing effect using a colored badge with an icon (e.g., ❤️ 1d6) next to the item name, to clearly differentiate it from the item's quantity or name.
- **FR-005**: The system MUST treat fixed (`heal`) and variable (`heal_dice`) values as mutually exclusive for display purposes.

### Key Entities *(include if feature involves data)*

- **Consumable Item**: Represents an item in the player's inventory. Its `effects` JSON contains attributes for specific effects, utilizing a numeric `heal` field for fixed healing and a string `heal_dice` field for dice-based variable healing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can instantly identify the healing value of an item within the active session screen without needing to click or open a details modal.
- **SC-002**: 100% of healing consumables in the database have their healing values correctly parsed and rendered in the UI.

## Assumptions

- Consumable items store their fixed healing value in `effects.heal` (numeric) and their variable healing value in `effects.heal_dice` (string).
- The changes are isolated to the UI components within the active session, specifically where consumable items are rendered.
