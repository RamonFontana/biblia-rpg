# Feature Specification: Mobile Components Responsiveness

**Feature Branch**: `032-mobile-components`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "eu configurei a responsividade da pagina activesessionpage.tsx agora quero configurar a responsividade de todos os compontes dentro dele, como por exemplo esse do print que está quebrado no mobile. Verifique se existe outro para corrijir tbm"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix NPC Card Responsiveness on Mobile (Priority: P1)

Mestres e jogadores acessam a sessão via dispositivos móveis e precisam visualizar as cartas de NPCs sem que o conteúdo fique quebrado ou ilegível. Atualmente, os controles de HP e CA/Escudo da carta de NPC estão "vazando" do contêiner.

**Why this priority**: É a área de uso central durante o jogo. Conteúdos cortados ou vazando impedem a visualização correta dos status da partida (HP, Classe de Armadura).

**Independent Test**: Can be fully tested by opening the session page on a mobile viewport (e.g. 320px - 400px width) and verifying the NPC cards.

**Acceptance Scenarios**:

1. **Given** a session with NPCs, **When** the page is rendered on a mobile screen, **Then** the HP and CA/Faith controls in the NPC card must adjust, wrap, or resize without breaking the horizontal layout of the card.
2. **Given** a long NPC name, **When** viewed on mobile, **Then** the text must truncate or wrap without forcing the card width to exceed the screen width.

---

### User Story 2 - Fix Player Card Responsiveness on Mobile (Priority: P2)

De maneira similar aos NPCs, as cartas que representam os jogadores ativos na sessão podem possuir controles semelhantes de HP/CA/Fé. Elas precisam também ser completamente responsivas.

**Why this priority**: Jogadores acessam primariamente a sessão pelo celular para ver seus próprios status e dos colegas.

**Independent Test**: Can be fully tested by opening the session page on a mobile viewport and verifying the Player cards in the main panel.

**Acceptance Scenarios**:

1. **Given** a session with connected players, **When** viewed on a mobile device, **Then** the player cards' action buttons and status indicators must fit perfectly within the card margins.

---

### User Story 3 - Audit and Fix Remaining Combat/Session Components (Priority: P3)

Existem outros componentes que são renderizados na tela `ActiveSessionPage` (como painel de combate, log de histórico, ações). Todos precisam ser revistos.

**Why this priority**: Assegura consistência visual e usabilidade em toda a extensão do componente.

**Independent Test**: Can be fully tested by starting a combat scenario on mobile and verifying that nothing breaks horizontally.

**Acceptance Scenarios**:

1. **Given** an active combat, **When** viewed on mobile, **Then** the initiative order, combat actions, and entity cards must not cause horizontal scrolling.
2. **Given** the history log, **When** viewed on mobile, **Then** entries must wrap correctly without breaking out of the container.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ensure that the NPC cards (`NPCList` ou equivalente) do not have elements (like HP/CA boxes) exceeding the parent container's width on viewports < 640px.
- **FR-002**: System MUST ensure that Player cards in the session view do not overflow horizontally on viewports < 640px.
- **FR-003**: System MUST utilize responsive grid, flex wrapping, or size adjustments (e.g., `flex-wrap`, `text-sm`, `w-full` on inner containers) for controls inside session cards.
- **FR-004**: System MUST ensure that any text within these cards that is too long wraps to the next line or is truncated gracefully (`truncate`).

### Key Entities

- **NPC Card Component**: The UI component responsible for displaying an NPC's status (HP, CA, visible state) in the active session.
- **Player Card Component**: The UI component displaying player character status.
- **Combat Tracker Component**: The UI component displaying the initiative and combat state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the session components (NPCs, Players, Combat Tracker) fit within the screen width on a 320px viewport without generating a horizontal scrollbar.
- **SC-002**: The HP, CA, and Faith control buttons in the NPC/Player cards are fully visible and clickable on mobile devices.

## Assumptions

- We are targeting standard mobile viewports (minimum width of around 320px, like iPhone SE or older Android devices).
- The general layout of `ActiveSessionPage` is already responsive; this spec only addresses the internal elements/components rendered within that layout.
- The use of Tailwind CSS utilities is assumed for fixing styling issues.
