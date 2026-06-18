# Research & Technical Decisions: Merge Enemy Creation Forms

## Needs Clarification & Resolutions

1. **How to manage form state and validation?**
   - **Decision**: Use `react-hook-form` coupled with `zod` for schema validation.
   - **Rationale**: User explicitly requested this for ease of development and flexibility. `zod` will handle complex object validations and `react-hook-form` will manage state efficiently without unnecessary re-renders.

2. **How should "skills" be handled dynamically in the form?**
   - **Decision**: Use `useFieldArray` from `react-hook-form` to allow dynamic addition/removal of skills, similar to how NPC items are handled. A skill can just be an object with `{ name: string, description?: string }` or simply strings.
   - **Rationale**: User requested that it be "bem aberto que nem a seleção de item de npc". This gives the GM the freedom to create custom skills on the fly for the enemy.

3. **Where do presets come from?**
   - **Decision**: The "Bestiário" preset list will be fetched from a predefined table or list (likely `items` with category `bestiary`, or an array of predefined base enemies). For now, we will maintain the existing preset fetch logic found in `SessionStepEnemies.tsx` and feed it to the new unified form.

## Technical Context Unknowns Resolved

- Form Management: `react-hook-form`
- Validation: `zod`
- Schema Changes: Add `skills` (e.g. `Array<{ name: string, description: string }>`) to `DraftCharacter` interface and Supabase JSON schema if needed.
