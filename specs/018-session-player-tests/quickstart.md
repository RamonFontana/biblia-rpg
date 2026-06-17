# Quickstart: Session Player Tests

To test the Session Player Tests feature:

1. **Setup Database**:
   Apply the migration `20260617000000_create_session_tests.sql` to your Supabase instance to create the `session_tests` and `session_test_results` tables.

2. **Open Session**:
   Log in as the Master in one browser window and as a Player (assigned to a character in the session) in another window.

3. **Master Action**:
   - In the Master's view, click the "Testes" button located above the character cards.
   - Select a test type (e.g., Percepção) and a difficulty (e.g., 12).
   - Select the connected Player and submit the test.

4. **Player Action**:
   - In the Player's window, verify that a blocking modal appears displaying the test type and difficulty.
   - Check the other characters' cards to ensure a "busy/testing" status is visible.
   - Enter a result value (e.g., 15) and submit.

5. **Verification**:
   - Return to the Master's window.
   - Verify that the player's result (15) appears in the dashboard and the status correctly updates to "Aprovado" (since 15 >= 12).
   - Once all players reply, close the test dashboard.
