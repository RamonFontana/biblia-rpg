# Data Model: Character Creation

## Entities

### `Character` (Table: `characters`)
Represents the finalized playable character saved to Supabase.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key, auto-generated |
| `user_id` | UUID | Foreign Key to `auth.users` |
| `name` | String | Character's narrative name |
| `tribe` | String | Selected Tribe (e.g., 'Levi', 'Judá') |
| `vocation` | String | Selected Class (e.g., 'Guerreiro', 'Sacerdote') |
| `attributes` | JSONB | Contains `{ for, des, con, int, sab, car }` |
| `fortress` | String | Selected virtue |
| `temptation` | String | Selected flaw |
| `stats` | JSONB | Initial calculated `{ pv, ca, faith }` |
| `equipment` | JSONB | Array of selected items and packages |
| `coins` | Integer | Remaining currency after merchant phase |
| `narrative` | JSONB | `{ image_url, physical_desc, history, personality }` |
| `created_at` | Timestamp | Creation date |

## Validation Rules (Zod Schemas)

The wizard will use the following Zod rules for frontend validation:
- `name`: Min 2 chars, Max 50.
- `attributes`: Must be between 3 and 18 for each stat.
- `coins`: Cannot be negative during the merchant phase.
- `vocation`: If `tribe` === 'Levi', `vocation` MUST be 'Sacerdote' or 'Sábio'.
