# Data Model

## Database Schema Changes

### `items` table update
A new migration will add an `effects` column to the `items` table.
```sql
ALTER TABLE public.items ADD COLUMN effects JSONB DEFAULT '{}'::jsonb;
```

Example of `effects` JSONB:
```json
{
  "heal": 10
}
```

### `stats` JSONB structure update (Implicit)
For both `characters` and `session_npcs`, the `stats` JSONB field will now formally expect:
```json
{
  "pv": 20, // max HP
  "current_pv": 15, // current HP
  "ca": 14,
  "faith": 100,
  "current_faith": 90
}
```

## TypeScript Interfaces

### Update `CharacterStats`
```typescript
export interface CharacterStats {
  pv: number;
  current_pv?: number;
  ca: number;
  faith: number;
  current_faith?: number;
}
```

### Update `Item` (Assuming it exists or creating it based on DB)
```typescript
export interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_consumable: boolean;
  requires_target: boolean;
  is_kit: boolean;
  weight: number;
  effects?: {
    heal?: number;
    restore_faith?: number;
    [key: string]: any;
  };
}
```
