# Feature Specification: Active Session Mobile Responsiveness

**Feature Branch**: `031-mobile-active-session`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "@[/Users/take5dev1/projects/rpg-biblico/src/pages/session/ActiveSessionPage.tsx] Configure essa tela para ser reponsivo para mobile"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player View on Mobile (Priority: P1)

As a Player using a mobile device, I want to see my character sheet, rest indicator, combat view, and the list of other participants clearly, so I can play the game comfortably on my phone without layout breakage.

**Why this priority**: Players are the largest group of users and frequently access the game from mobile devices. The core gameplay loop requires the player view to be fully functional on smaller screens.

**Independent Test**: Can be fully tested by loading a session as a Player on a mobile viewport (e.g., 375px width) and interacting with all available elements (dice, sheet, trades) without encountering horizontal scroll or overlapping elements.

**Acceptance Scenarios**:

1. **Given** the active session page, **When** viewed on a mobile screen as a Player, **Then** the character sheet takes full width, and the participant list stacks below it.
2. **Given** the session header, **When** viewed on a mobile screen, **Then** the buttons (dice, etc.) and session info wrap properly or adjust their layout to fit the screen width.

---

### User Story 2 - GM View on Mobile (Priority: P1)

As a Game Master (GM) using a mobile device, I want to access all session controls (advance time, combat, tests) and view participant/enemy/NPC lists without horizontal scrolling or overlapping elements, so I can run the game smoothly from my phone.

**Why this priority**: GMs need to manage the game flow. If the GM controls are unusable on mobile, they cannot run the game effectively unless they are on a desktop.

**Independent Test**: Can be fully tested by loading a session as a GM on a mobile viewport and ensuring all GM-specific buttons and lists are usable and visually distinct.

**Acceptance Scenarios**:

1. **Given** the active session page, **When** viewed on a mobile screen as a GM, **Then** the GM control buttons in the header are easily accessible and do not overflow the screen.
2. **Given** the middle content grid (participants, enemies, NPCs), **When** viewed on a mobile screen, **Then** the lists stack vertically (1 column) instead of side-by-side.

---

### User Story 3 - Modals on Mobile (Priority: P2)

As any user using a mobile device, I want modals (trades, tests, combat setup, dice roller) to fit my screen properly, so I can use them without part of the modal being cut off.

**Why this priority**: Modals are critical for interactions, but the main screen layout is the primary blocker for basic usage.

**Independent Test**: Can be fully tested by opening each modal on a mobile viewport and verifying it fits within the screen and is scrollable if needed.

**Acceptance Scenarios**:

1. **Given** an open modal, **When** viewed on a mobile screen, **Then** the modal takes up appropriate width (e.g., 90-100%) and its content is scrollable vertically if it exceeds the screen height.

### Edge Cases

- What happens when a player or NPC has a very long name on a small screen? (Names should truncate with an ellipsis).
- How does the system handle complex nested components like the CombatDashboard or CharacterSheetView on very narrow screens?
- What happens to the top bar layout if the session name is very long combined with the status badges?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST adapt the session header to ensure session title, badges (day/period/status), and action buttons fit on narrow screens (e.g., by allowing flex wrapping, stacking, or a responsive menu approach).
- **FR-002**: System MUST ensure all main grids (GM view grids and Player view grids) use a 1-column layout on mobile screens, expanding to multi-column only on `md` or `lg` breakpoints.
- **FR-003**: Users MUST be able to tap all interactive elements easily on mobile. Buttons in the header should not overflow or break the layout.
- **FR-004**: System MUST handle long texts in headers and lists by applying appropriate truncation (`truncate` or `break-words`).
- **FR-005**: System MUST ensure that `ActiveSessionPage` components and its children (like CombatDashboard, RestControls) are responsive and do not force horizontal scrolling on the page body.

### Key Entities 

- **ActiveSessionPage**: The main container that needs responsive layout adjustments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the active session page content is visible and interactive on screens as narrow as 320px without unintended horizontal scrolling on the main `body`.
- **SC-002**: All buttons in the header maintain a usable size and do not overlap with other elements on a 375px wide viewport.
- **SC-003**: The GM lists (Participants, Enemies, NPCs) and Player layout (Character Sheet, Participants) display as single columns on mobile devices, preventing squished UI.

## Assumptions

- Responsiveness will be achieved primarily using CSS utility classes (e.g., Tailwind's `flex-col`, `flex-wrap`, `grid-cols-1`, `md:grid-cols-2`, etc.) within `ActiveSessionPage.tsx` and its immediate children if necessary.
- The core functionality of the page will not change, only its visual presentation on smaller screens.
- Modals are already reasonably responsive, but their specific sizing classes might need minor tweaks if they break the mobile view.
