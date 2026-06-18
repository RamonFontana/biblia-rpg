# Quickstart: Merge Enemy Creation Forms

This document outlines how the new unified enemy creation form will be integrated and tested within the application.

## 1. Setup Form Schema

A new `EnemyFormSchema` will be created using `zod` to handle validation for the enemy creation form.

```typescript
// src/components/session/enemy-form/schema.ts
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

## 2. Component Structure

The `UnifiedEnemyForm` component will use `react-hook-form` to manage the form state and `zodResolver` for validation. It will include dynamic fields for skills using `useFieldArray`.

```tsx
// src/components/session/enemy-form/UnifiedEnemyForm.tsx
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enemyFormSchema, EnemyFormValues } from './schema';

// Component structure:
// - Header with "Base/Bestiário" selector
// - Image upload
// - Vocation input
// - Core Stats (HP, AC)
// - Attributes (FOR, DES, CON, INT, SAB, CAR)
// - Skills (Dynamic list using useFieldArray)
// - Submit Button
```

## 3. Integration Points

*   **Pre-Session Creation (`SessionStepEnemies.tsx`):** Replace the existing enemy addition logic with the `UnifiedEnemyForm`. The form will submit data to the local session state.
*   **In-Session Creation (`CreateEnemyDialog.tsx`):** Use the `UnifiedEnemyForm` within the dialog. The form will submit data directly to the database to spawn a new enemy dynamically.

## 4. Testing

1.  Navigate to the session creation flow.
2.  Add a new enemy. Verify the new form is displayed.
3.  Test selecting a preset from the "Base/Bestiário". Verify the form fields populate correctly.
4.  Test adding, editing, and removing skills dynamically.
5.  Submit the form and verify the enemy is added to the session state.
6.  Start the session.
7.  Open the GM enemy list and click "Criar Inimigo". Verify the same form is displayed.
8.  Fill out the form, including an image and skills, and submit.
9.  Verify the new enemy appears in the session list with all provided data.
