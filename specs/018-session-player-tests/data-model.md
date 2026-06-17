# Data Model: Session Player Tests

## New Tables

### `session_tests`
Stores the test initiated by the Master.
- `id`: uuid (PK)
- `session_id`: uuid (FK to sessions)
- `test_type`: string (e.g., 'Percepção', 'Fé')
- `difficulty`: integer (0-20)
- `status`: string ('active', 'completed', 'cancelled')
- `created_at`: timestamp

### `session_test_results`
Stores the individual results of players for a specific test.
- `id`: uuid (PK)
- `test_id`: uuid (FK to session_tests)
- `character_id`: uuid (FK to characters)
- `player_id`: uuid (FK to profiles/users)
- `result_value`: integer (nullable, null means pending)
- `is_approved`: boolean (nullable, computed or evaluated by client)
- `status`: string ('pending', 'submitted')
- `created_at`: timestamp
- `updated_at`: timestamp

## Existing Entities Updates
No schema changes required for existing entities. UI state will read from `session_test_results` to determine if a character is currently 'busy' with a pending test.
