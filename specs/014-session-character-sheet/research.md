# Research & Technical Decisions: Session Character Sheet

## Technical Context

- **Language/Version**: TypeScript, React 18+
- **Primary Dependencies**: TailwindCSS, Supabase Auth/Realtime, `lucide-react` for icons, `shadcn/ui` (or similar Tailwind components based on `Button` usage).
- **Storage**: Supabase (game_sessions, users, characters tables).
- **Project Type**: Web Application (React SPA).

## Design Decisions

### 1. UI Design for Players List
- **Decision**: Redesign the online players list to use a grid of player cards or a more interactive list where each item is clickable. For the GM, clicking a player card opens their full character sheet.
- **Rationale**: The current `OnlinePlayersList` is very basic. A better design will provide clear visual feedback and make it obvious that the GM can interact with the players.

### 2. Character Sheet View Component
- **Decision**: Create a new reusable component `CharacterSheetView` that takes a `characterId` or full character object as a prop and displays a read-only (or slightly interactive) view of the full character sheet. This component will be used inside a modal (Dialog) or a slide-out panel (Sheet) when the GM clicks a player, and directly inline for the Player's own view.
- **Rationale**: Modals/Slide-outs keep the user in the context of the active session without navigating away. Reusing the component for both GM and Player ensures consistency.

### 3. Data Fetching
- **Decision**: Use Supabase queries to fetch the character associated with the `user_id` for the current session.
- **Rationale**: Real-time isn't strictly requested for reading the sheet, but fetching the latest data on click or component mount ensures accuracy.

### Alternatives Considered
- *Separate page for character sheet*: Rejected because it breaks the "Active Session" context. The GM needs to see the session state while checking player stats.
