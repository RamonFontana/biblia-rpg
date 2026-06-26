# Quickstart: 040-ability-usage-system

This quickstart guides you through implementing the ability usage system feature.

## 1. Standardize Documentation (Crucial First Step)

Before writing any code, standardize all 17 markdown files in `docs/tribos/` and `docs/vocacoes/`. Use the format seen in `docs/vocacoes/sacerdote.md`:

```markdown
| Nome | Nível Min. | Tipo Ação | Dado de Rolagem | Usos/Recarga | Efeito |
```

If a tribe has passive abilities with no dice, document them as `Passiva`, roll dice `-`, uses `-`.

## 2. Refactor Ability Data Structure

1. Create or update `src/data/abilities.ts`.
2. Implement the `AbilityDefinition` interface defined in `data-model.md`.
3. Manually map the standardized documentation into this TypeScript array. Ensure IDs match the strings that will be stored in the database.

## 3. Update Character Type and DB Fetching

1. Update `src/types/character.ts` to type the `skills` JSONB column as defined in `data-model.md`.
2. Ensure that any code fetching a character (`supabase.from('characters')`) properly types this field.

## 4. Implement Ability Cards in UI

1. Open `src/components/combat/PlayerCombatView.tsx`.
2. Add a new section below existing actions for "Habilidades".
3. Filter the static `abilities.ts` based on the character's level, tribe, vocation, and the choices persisted in `character.skills.path_choices`.
4. Render a card for each active ability. Include the dice, action type, description, and a "Use" button.
5. Passive abilities should be rendered differently (no use button).

## 5. Implement Usage Logic

1. When a player clicks "Use" on an ability, verify `current_uses > 0`.
2. If it's a "per combat" ability, verify that a combat is currently active (via `combatStore`).
3. Call Supabase to decrement the `current_uses` inside the `skills.ability_uses` JSONB object for that ability ID.
4. Optimistically update the UI.

## 6. Implement Recharge Triggers

1. Open `src/components/session/SessionRestControls.tsx`.
2. When the DM clicks "Descanso Curto", fire a DB update that resets `current_uses` to `max_uses` for all abilities with `rechargeUnit === 'short_rest'`.
3. When the DM clicks "Descanso Longo", reset `short_rest`, `long_rest`, and `day` abilities.
4. Hook into the start of a combat session (likely in `combatStore.ts` or the DM combat controls) to reset `combat` abilities.
