# Data Model: Merge Enemy Creation Forms

## Entities

### `DraftCharacter` (Typescript Interface)
Extends the existing interface to support skills.

```typescript
export interface EnemySkill {
  name: string;
  description: string;
}

export interface DraftCharacter {
  name?: string;
  vocation?: string; // Classe do inimigo
  // tribe is omitted/ignored for enemies
  attributes?: CharacterAttributes;
  stats?: CharacterStats;
  narrative?: CharacterNarrative;
  skills?: EnemySkill[]; // NEW FIELD
  // ... other fields
}
```

### Database Schema Updates
No new columns needed. The `skills` array will be stored as a top-level JSONB field in the `characters` table or inside `narrative` depending on the current DB schema. If the table `characters` has no `skills` column, we can store it in the `narrative` JSONB object, e.g., `narrative.skills`. Let's assume we store it in `narrative` or we add a new JSONB column `skills` via migration if necessary. Actually, for simplicity and to avoid migrations, we can store it inside the `narrative` JSON as `narrative: { ..., skills: [...] }` or if the user wants it at the root, we might need a migration `ALTER TABLE characters ADD COLUMN skills JSONB`. Let's assume we store it in the `skills` column, which might require a migration `add_skills_to_characters`.

### Forms state (Zod Schema)
```typescript
import { z } from 'zod';

export const enemyFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  vocation: z.string().optional(),
  hpMax: z.number().min(1),
  hpCurrent: z.number().min(0),
  ca: z.number().min(0),
  attributes: z.object({
    for: z.number(),
    des: z.number(),
    con: z.number(),
    int: z.number(),
    sab: z.number(),
    car: z.number(),
  }),
  skills: z.array(z.object({
    name: z.string().min(1, 'Nome da habilidade é obrigatório'),
    description: z.string()
  })).optional(),
  imageBase64: z.string().optional()
});

export type EnemyFormValues = z.infer<typeof enemyFormSchema>;
```
