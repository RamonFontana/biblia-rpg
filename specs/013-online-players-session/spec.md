# Feature Specification: Online Players Session

**Feature Branch**: `013-online-players-session`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "quero agora na sessão quando iniciada, listar o jogadores online@[/Users/take5dev1/projects/rpg-biblico/src/pages/session/ActiveSessionPage.tsx] . Quero também configurar pela tela do jogador quando ele se logar, aparecer o botão de entrar na sessão que o personagem dele está. E quando ele entrar na sessão, na visão do mestre vai mostrar que o jogador está online."

## Clarifications

### Session 2026-06-16

- Q: Como devemos lidar quando a conexão do jogador cai inesperadamente? → A: Marcar offline automaticamente usando o timeout do Supabase Presence.
- Q: O que acontece se o jogador tiver múltiplos personagens em diferentes sessões ativas simultaneamente? → A: Mostrar botões/lista para todas as sessões ativas que ele tem personagens.
- Q: Onde exatamente o botão 'Entrar na Sessão' deve aparecer para o jogador? → A: Na dashboard principal logo após o login.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join Active Session (Priority: P1)

As a Player, I want to see a button to join an active session my character is part of right after I log in, so I can easily enter the game.

**Why this priority**: Without this, players cannot enter the active sessions their characters are assigned to.

**Independent Test**: Can be fully tested by logging in as a user with a character in an active session and seeing the "Join Session" button.

**Acceptance Scenarios**:

1. **Given** a player is logged in and their character is in an active session, **When** they view their dashboard/initial screen, **Then** a button to join the active session is displayed.
2. **Given** a player clicks the "Join Session" button, **When** the navigation occurs, **Then** they are taken to the active session screen.

---

### User Story 2 - View Online Players (Master View) (Priority: P1)

As a Game Master, I want to see a list of online players in the active session, so I can know who is present in the game.

**Why this priority**: Essential for the master to manage the session and know who is currently connected.

**Independent Test**: Can be fully tested by having a master start a session and having a player join it; the master should see the player's status update to online.

**Acceptance Scenarios**:

1. **Given** the master is on the ActiveSessionPage, **When** a player enters the session, **Then** the player's status in the player list updates to online.
2. **Given** the master is on the ActiveSessionPage, **When** a player leaves the session, **Then** the player's status in the player list updates to offline.

### Edge Cases

- What happens if a player tries to join a session that the master has paused or ended?
- Players with multiple characters in different active sessions will see a list/multiple buttons allowing them to choose which session to join.
- If a player's connection drops unexpectedly, they will be marked offline automatically by Supabase Presence timeout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Join Session" action (button or list of buttons) on the main dashboard for players when they log in if they have characters belonging to ongoing sessions.
- **FR-002**: System MUST track the online/offline presence of players within an active session using Supabase Presence.
- **FR-003**: System MUST display a list of players on the master's active session screen (`ActiveSessionPage.tsx`).
- **FR-004**: System MUST update the player's online status in real-time on the master's view when the player joins or leaves the session.

### Key Entities *(include if feature involves data)*

- **Session**: The active RPG session.
- **Player/Character**: The user participating in the session.
- **Presence State**: The real-time online/offline status of a user within a session context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Master can see player presence updates within 2 seconds of the player joining/leaving.
- **SC-002**: Players with active sessions can enter the session with a single click after logging in.

## Assumptions

- Real-time presence will be handled via Supabase Realtime (Presence) since the project uses Supabase.
