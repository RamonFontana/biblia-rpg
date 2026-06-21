# Quickstart: mobile-active-session

## Testing the Mobile Responsiveness

1. Start the application locally.
2. Join an active session as a Player or GM.
3. Open your browser's Developer Tools (F12) and toggle the Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M) to simulate a mobile device (e.g., iPhone 12/13/14 or Pixel 5).
4. Verify the following:
   - The top header buttons are accessible via the new `DropdownMenu` (for GM actions).
   - The main grids (like `SessionParticipantList`, `SessionEnemyList`, `SessionNPCList`) stack vertically (1 column) on the mobile view.
   - The `CharacterSheetView` fits properly without overflowing horizontally.
   - Click on buttons that open modals (Dice Roller, Trades, Tests) and verify the modals fit within the screen height and width, and are scrollable if necessary.
