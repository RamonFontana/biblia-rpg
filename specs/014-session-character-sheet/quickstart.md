# Quickstart: Session Character Sheet

This feature enhances the active session screen for both Game Masters and Players.

## For Developers

1. **Components to check**: 
   - `src/pages/session/ActiveSessionPage.tsx`
   - `src/components/session/OnlinePlayersList.tsx`
2. **New Components to create**:
   - `src/components/character/CharacterSheetView.tsx`: A read-only UI for the character sheet.
   - `src/components/session/PlayerCard.tsx`: An improved card for the online players list.

## Usage

- **As GM**: Go to an active session, see the list of online players. Click on a player's card to open a modal with their full character sheet, allowing you to quickly check their AC, HP, Faith, and attributes without asking.
- **As Player**: Go to an active session. In the "Seu Personagem" area, you will see a beautifully designed summary of your character, and a button to expand to the full sheet.
