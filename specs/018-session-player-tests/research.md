# Research: Session Player Tests

## Context

The feature is to implement real-time player tests during a game session. The Master selects a test type, sets difficulty, and sends it to chosen players. The players receive a dialog, input their physical dice roll result, and submit it. The Master sees the results and approval status in real-time.

## User Requests
- "a ideia é usar o realtime para essa interação com os jogadores" -> We will use Supabase Realtime (Database changes or Broadcast).
- "o design pode montar no que achar melhor, mas prefiro que seja um dialog para o mestre e para os jogadores" -> Both the master's initiator and the player's responder will use modal dialogs.
- "enquanto os jogadores estão realizando o teste, mostrar para todos os outros jogadores um status que ele está ocupado, deixando ele bloqueado" -> Add a "busy" or "testing" status in the UI for players currently taking a test.
- "trigger do teste na visão do mestre vai pode ser um botão logo acima dos cards de jogadores online, inimigos e npcs da sessão." -> UI placement for the Master's trigger button.

## Decisions

### Decision: Realtime Communication Mechanism
**Decision:** Use Supabase Realtime Database Subscriptions (insert/update on `session_tests` and `session_test_results` tables).
**Rationale:** To ensure persistence and handle edge cases like player temporary disconnection. If a player disconnects and reconnects, they should still see the pending test if it hasn't been closed by the Master.
**Alternatives considered:** Supabase Broadcast channels. Rejected because ephemeral messages are lost if a client temporarily drops connection or refreshes the page.

### Decision: Database Schema
**Decision:** Create a `session_tests` table for the test session itself, and `session_test_results` for individual player results.
**Rationale:** Standard 1-to-N relationship mapping the Master's single request to multiple player responses.

### Decision: UI Blocking for Busy Players
**Decision:** When a player has an active pending test, they see a blocking modal. Other players see a visual indicator (like an hourglass or "Fazendo Teste" badge) on the busy player's card in the session view.
**Rationale:** Meets the user's specific requirement to show a busy status and block the player.

### Decision: Master Test Interface
**Decision:** The Master sees a dialog to create the test. Once sent, the dialog transitions to a "Results Dashboard" showing real-time updates of who answered and who is still pending, including pass/fail calculations.
**Rationale:** Provides a seamless UX for the Master without navigating away from the session view.
